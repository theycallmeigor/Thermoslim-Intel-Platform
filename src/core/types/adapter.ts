export interface IAdapter {
  name: string;
  connect(): Promise<void>;
  sync(options?: SyncOptions): Promise<SyncResult>;
  mapToSchema(rawData: unknown): NormalizedRecord[];
  handleWebhook?(payload: unknown): Promise<void>;
  disconnect(): Promise<void>;
}

export interface SyncOptions {
  startDate?: Date;
  endDate?: Date;
  fullSync?: boolean;
  pageSize?: number;
}

export interface SyncResult {
  source: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: SyncError[];
  duration: number;
}

export interface SyncError {
  recordId?: string;
  message: string;
  payload?: unknown;
}

export type NormalizedRecord = {
  type: 'order' | 'customer' | 'subscription' | 'product' | 'event';
  data: Record<string, unknown>;
};
