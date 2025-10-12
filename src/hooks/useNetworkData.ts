import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import useWebSocket from "react-use-websocket";
import { API_ROUTES, BACKEND_WS_URL } from "../config";
import type {
  BackendDevice,
  BackendStatsPayload,
  Client,
  Event,
} from "../types";

const DOWNLOAD_HISTORY_LENGTH = 60;
const EVENTS_CACHE_LIMIT = 500;
const CLIENT_STALE_MS = 10_000;
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const mbpsToBps = (mbps?: number) =>
  typeof mbps === "number" && !Number.isNaN(mbps) ? mbps * 1_000_000 : 0;
const formatTimeLabel = (timestamp: number) =>
  timeFormatter.format(new Date(timestamp));

type HistoryPoint = { timestamp: number; download: number };
type ClientHistoryPoint = { timestamp: number; value: number };

const normalizeDevices = (payload: BackendStatsPayload): BackendDevice[] => {
  if (payload.devices && payload.devices.length > 0) {
    return payload.devices.map((device) => ({ ...device }));
  }

  if (payload.clients) {
    return Object.entries(payload.clients).map(([ip, client]) => {
      const window = client.bytes_window ?? [];
      const latestBytes = window[window.length - 1] ?? 0;
      const downBps = latestBytes * 8;
      return {
        ip,
        mac: client.mac,
        hostname: client.hostname,
        status: client.status,
        down_mbps: downBps / 1_000_000,
      } satisfies BackendDevice;
    });
  }

  return [];
};

export const THRESHOLD_BPS = 1_600_000 * 8;
export const DEFAULT_THROTTLE_LIMIT_MBPS = 2;

export function useNetworkData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [chartData, setChartData] = useState<
    { name: string; download: number }[]
  >([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedClientIp, setSelectedClientIp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pendingActionIp, setPendingActionIp] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const historyRef = useRef<HistoryPoint[]>([]);
  const clientHistoryRef = useRef<Record<string, ClientHistoryPoint[]>>({});
  const previousStatusesRef = useRef<Record<string, Client["status"]>>({});
  const eventRegistryRef = useRef<Map<string, number>>(new Map());
  const clientsRef = useRef<Client[]>([]);
  const chartDataRef = useRef<{ name: string; download: number }[]>([]);
  const deviceCacheRef = useRef<
    Map<string, { device: BackendDevice; lastSeen: number }>
  >(new Map());

  const { lastJsonMessage, readyState } = useWebSocket<BackendStatsPayload>(
    BACKEND_WS_URL,
    {
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 3_000,
      onOpen: () => console.log("[useNetworkData] WebSocket connected"),
      onClose: () => console.log("[useNetworkData] WebSocket disconnected"),
    }
  );

  const trimEventRegistry = useCallback(() => {
    const registry = eventRegistryRef.current;
    if (registry.size <= EVENTS_CACHE_LIMIT) return;
    const entries = Array.from(registry.entries()).sort((a, b) => a[1] - b[1]);
    const trimmed = entries.slice(entries.length - EVENTS_CACHE_LIMIT);
    eventRegistryRef.current = new Map(trimmed);
  }, []);

  const registerEventMessage = useCallback(
    (message: string, timestamp: number) => {
      if (!eventRegistryRef.current.has(message)) {
        eventRegistryRef.current.set(message, timestamp);
        trimEventRegistry();
        return true;
      }
      return false;
    },
    [trimEventRegistry]
  );

  const computeChartData = useCallback(() => {
    const nextChartData = historyRef.current.map((point) => ({
      name: formatTimeLabel(point.timestamp),
      download: point.download,
    }));

    const prevChartData = chartDataRef.current;
    const isEqual =
      prevChartData.length === nextChartData.length &&
      prevChartData.every((prevPoint, index) => {
        const nextPoint = nextChartData[index];
        return (
          prevPoint.download === nextPoint?.download &&
          prevPoint.name === nextPoint?.name
        );
      });

    if (!isEqual) {
      console.log("[useNetworkData] Updating chart data", {
        points: nextChartData.length,
        from: prevChartData.length,
      });
      chartDataRef.current = nextChartData;
      setChartData(nextChartData);
    }
  }, []);

  const getActiveDevices = useCallback(
    (devices: BackendDevice[], timestampMs: number): BackendDevice[] => {
      const cache = deviceCacheRef.current;

      devices.forEach((device) => {
        const existing = cache.get(device.ip);
        const mergedDevice: BackendDevice = existing
          ? { ...existing.device, ...device }
          : { ...device };
        cache.set(device.ip, { device: mergedDevice, lastSeen: timestampMs });
      });

      const cutoff = timestampMs - CLIENT_STALE_MS;
      cache.forEach((entry, ip) => {
        if (entry.lastSeen < cutoff) {
          console.log("[useNetworkData] removing stale client", { ip });
          cache.delete(ip);
        }
      });

      return Array.from(cache.values()).map((entry) => entry.device);
    },
    []
  );

  const updateClientHistories = useCallback(
    (devices: BackendDevice[], timestampMs: number) => {
      const seenIps = new Set<string>();

      devices.forEach((device) => {
        const ip = device.ip;
        seenIps.add(ip);
        const download = mbpsToBps(device.down_mbps);
        const existing = clientHistoryRef.current[ip] ?? [];
        const nextHistory = [
          ...existing,
          { timestamp: timestampMs, value: download },
        ].slice(-DOWNLOAD_HISTORY_LENGTH);
        clientHistoryRef.current[ip] = nextHistory;
      });

      Object.keys(clientHistoryRef.current).forEach((ip) => {
        if (!seenIps.has(ip)) {
          delete clientHistoryRef.current[ip];
        }
      });
    },
    []
  );

  const buildClientModels = useCallback(
    (devices: BackendDevice[], previousClients: Client[]): Client[] => {
      const previousMap = new Map(
        previousClients.map((client) => [client.ip, client])
      );

      const nextClients = devices.map((device) => {
        const download = mbpsToBps(device.down_mbps);
        const status = device.status === "throttled" ? "throttled" : "normal";
        const history = clientHistoryRef.current[device.ip] ?? [];
        const previousClient = previousMap.get(device.ip);

        let downloadHistory = history.map((entry) => ({
          name: formatTimeLabel(entry.timestamp),
          value: entry.value,
        }));

        if (
          previousClient &&
          previousClient.downloadHistory.length === downloadHistory.length
        ) {
          const sameHistory = previousClient.downloadHistory.every(
            (prevEntry, index) => {
              const nextEntry = downloadHistory[index];
              return (
                prevEntry.value === nextEntry.value &&
                prevEntry.name === nextEntry.name
              );
            }
          );
          if (sameHistory) {
            downloadHistory = previousClient.downloadHistory;
          }
        }

        if (
          previousClient &&
          previousClient.status === status &&
          previousClient.liveDownload === download &&
          previousClient.downloadHistory === downloadHistory
        ) {
          return previousClient;
        }

        const nextClient: Client = {
          ip: device.ip,
          status,
          liveDownload: download,
          downloadHistory,
        };

        if (!previousClient || previousClient !== nextClient) {
          console.log("[useNetworkData] Client updated", {
            ip: device.ip,
            download,
            status,
          });
        }

        return nextClient;
      });

      if (
        previousClients.length === nextClients.length &&
        previousClients.every(
          (prevClient, index) => prevClient === nextClients[index]
        )
      ) {
        return previousClients;
      }

      return nextClients;
    },
    []
  );

  const deriveEvents = useCallback(
    (
      payload: BackendStatsPayload,
      timestampMs: number,
      processedClients: Client[]
    ) => {
      const freshEvents: Event[] = [];

      const currentIps = new Set(processedClients.map((client) => client.ip));
      Object.keys(previousStatusesRef.current).forEach((ip) => {
        if (!currentIps.has(ip)) {
          delete previousStatusesRef.current[ip];
        }
      });

      processedClients.forEach((client) => {
        const previousStatus = previousStatusesRef.current[client.ip];
        if (previousStatus && previousStatus !== client.status) {
          const type: Event["type"] =
            client.status === "throttled" ? "throttle" : "unthrottle";
          freshEvents.push({
            timestamp: new Date(timestampMs),
            message: `${type === "throttle" ? "Throttled" : "Unthrottled"} ${
              client.ip
            }`,
            type,
          });
        }
        previousStatusesRef.current[client.ip] = client.status;
      });

      (payload.events ?? []).forEach((message) => {
        if (typeof message !== "string" || message.trim().length === 0) return;
        if (registerEventMessage(message, timestampMs)) {
          const normalized = message.toLowerCase();
          const type: Event["type"] =
            normalized.includes("unthrottle") ||
            normalized.includes("un-throttle")
              ? "unthrottle"
              : normalized.includes("throttle")
              ? "throttle"
              : "throttle";
          freshEvents.push({
            timestamp: new Date(timestampMs),
            message,
            type,
          });
        }
      });

      if (freshEvents.length > 0) {
        setEvents((prev) => [...freshEvents, ...prev].slice(0, 50));
      }
    },
    [registerEventMessage]
  );

  const processPayload = useCallback(
    (payload: BackendStatsPayload) => {
      const timestampMs =
        typeof payload.timestamp === "number"
          ? payload.timestamp * 1000
          : Date.now();
      const rawDevices = normalizeDevices(payload);
      const devices = getActiveDevices(rawDevices, timestampMs);

      updateClientHistories(devices, timestampMs);

      const previousClients = clientsRef.current;
      const processedClients = buildClientModels(devices, previousClients);
      const activeClients =
        processedClients === previousClients
          ? previousClients
          : processedClients;

      if (processedClients !== previousClients) {
        console.log("[useNetworkData] setClients", {
          count: processedClients.length,
        });
        clientsRef.current = processedClients;
        setClients(processedClients);
      }

      setSelectedClientIp((currentSelected) => {
        if (activeClients.length === 0) return null;
        if (!currentSelected) return activeClients[0].ip;
        if (!activeClients.some((client) => client.ip === currentSelected)) {
          return activeClients[0].ip;
        }
        return currentSelected;
      });

      const totalDownBps =
        mbpsToBps(payload.global?.total_down_mbps) ||
        devices.reduce((sum, device) => sum + mbpsToBps(device.down_mbps), 0) ||
        activeClients.reduce((sum, client) => sum + client.liveDownload, 0);

      historyRef.current = [
        ...historyRef.current,
        { timestamp: timestampMs, download: totalDownBps },
      ].slice(-DOWNLOAD_HISTORY_LENGTH);
      computeChartData();

      deriveEvents(payload, timestampMs, activeClients);
      setLastUpdated(new Date(timestampMs));
    },
    [
      buildClientModels,
      computeChartData,
      deriveEvents,
      getActiveDevices,
      updateClientHistories,
    ]
  );

  const fetchCurrentDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.devices);
      if (!response.ok) {
        throw new Error(
          `Failed to load devices: ${response.status} ${response.statusText}`
        );
      }
      const payload = (await response.json()) as BackendStatsPayload;
      processPayload(payload);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to contact backend.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [processPayload]);

  // Only fetch once on mount
  useEffect(() => {
    fetchCurrentDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lastJsonMessage) {
      processPayload(lastJsonMessage);
    }
  }, [lastJsonMessage, processPayload]);

  const throttleDevice = useCallback(
    async (ip: string, limitMbps: number = DEFAULT_THROTTLE_LIMIT_MBPS) => {
      setPendingActionIp(ip);
      setActionError(null);
      setActionMessage(null);
      try {
        const response = await fetch(API_ROUTES.throttle, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ip,
            action: "throttle",
            limit_mbps: Number(limitMbps.toFixed(2)),
            reason: "Triggered from dashboard",
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Failed to throttle ${ip}`);
        }
        setActionMessage(`Throttled ${ip} to ${limitMbps} Mbps`);
        await fetchCurrentDevices();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unknown error throttling device.";
        setActionError(message);
        throw err;
      } finally {
        setPendingActionIp(null);
      }
    },
    [fetchCurrentDevices]
  );

  const unthrottleDevice = useCallback(
    async (ip: string) => {
      setPendingActionIp(ip);
      setActionError(null);
      setActionMessage(null);
      try {
        const response = await fetch(API_ROUTES.throttle, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ip,
            action: "unthrottle",
            reason: "Triggered from dashboard",
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Failed to unthrottle ${ip}`);
        }
        setActionMessage(`Unthrottled ${ip}`);
        await fetchCurrentDevices();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unknown error unthrottling device.";
        setActionError(message);
        throw err;
      } finally {
        setPendingActionIp(null);
      }
    },
    [fetchCurrentDevices]
  );

  const resetActionMessage = useCallback(() => {
    setActionMessage(null);
    setActionError(null);
  }, []);

  const rateLimitWarning = useMemo(() => {
    if (!lastUpdated) return null;
    const ageSeconds = (Date.now() - lastUpdated.getTime()) / 1000;
    return ageSeconds > 15
      ? `Data is ${Math.round(ageSeconds)}s old. Check backend connection.`
      : null;
  }, [lastUpdated]);

  return {
    clients,
    chartData,
    events,
    selectedClientIp,
    setSelectedClientIp,
    isLoading,
    error,
    lastUpdated,
    websocketReadyState: readyState,
    rateLimitWarning,
    throttleDevice,
    unthrottleDevice,
    pendingActionIp,
    actionMessage,
    actionError,
    resetActionMessage,
    refresh: fetchCurrentDevices,
  } as const;
}
