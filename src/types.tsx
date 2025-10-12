export type Client = {
  ip: string;
  status: "normal" | "throttled";
  liveDownload: number;
  downloadHistory: { name: string; value: number }[];
};

export type Event = {
  timestamp: Date;
  message: string;
  type: "throttle" | "unthrottle";
};

export type BackendDevice = {
  ip: string;
  mac?: string;
  hostname?: string;
  down_mbps?: number;
  up_mbps?: number;
  status?: "normal" | "throttled" | string;
};

export type BackendLegacyClient = {
  status?: "normal" | "throttled" | string;
  bytes_window?: number[];
  mac?: string;
  hostname?: string;
};

export type BackendStatsPayload = {
  timestamp?: number;
  global?: {
    total_down_mbps?: number;
    total_up_mbps?: number;
  };
  devices?: BackendDevice[];
  clients?: Record<string, BackendLegacyClient>;
  events?: string[];
};
