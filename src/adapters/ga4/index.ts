// ga4 adapter — implements IAdapter
// See docs/adapters/ga4-adapter.md for spec

import { IAdapter } from '../../core/types/adapter';

export class Ga4Adapter implements IAdapter {
  name = 'ga4';

  async connect() { /* TODO */ }
  async sync() { return { source: this.name, recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0, errors: [], duration: 0 }; }
  mapToSchema(raw: unknown) { return []; }
  async handleWebhook(payload: unknown) { /* TODO */ }
  async disconnect() { /* TODO */ }
}
