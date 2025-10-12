const sanitizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

const rawHttpBase =
  (import.meta.env.VITE_BACKEND_HTTP_URL as string | undefined) ??
  "http://127.0.0.1:8082";
const httpBase = sanitizeBaseUrl(rawHttpBase);

const rawWsUrl = import.meta.env.VITE_BACKEND_WS_URL as string | undefined;

const inferWebSocketUrl = (baseUrl: string) => {
  try {
    const parsed = new URL(baseUrl);
    parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    if (!parsed.pathname.endsWith("/")) {
      parsed.pathname += "/";
    }
    parsed.pathname = `${parsed.pathname.replace(/\/+$/, "")}/ws/stats/`;
    return parsed.toString();
  } catch (error) {
    console.warn(
      "Failed to infer WebSocket URL from base HTTP URL, falling back to default.",
      error
    );
    return "ws://127.0.0.1:8082/ws/stats/";
  }
};

const websocketUrl = rawWsUrl ?? inferWebSocketUrl(httpBase);

export const BACKEND_HTTP_BASE = httpBase;
export const BACKEND_WS_URL = websocketUrl;

export const API_ROUTES = {
  devices: `${httpBase}/api/devices/`,
  throttle: `${httpBase}/api/throttle/`,
  health: `${httpBase}/api/health/`,
};
