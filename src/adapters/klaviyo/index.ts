// klaviyo adapter — implements IAdapter
// See docs/adapters/klaviyo-adapter.md for spec

import { IAdapter } from '../../core/types/adapter';

export class KlaviyoAdapter implements IAdapter {
  name = 'klaviyo';

  async connect() { /* TODO */ }
  async sync() { return { source: this.name, recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0, errors: [], duration: 0 }; }
  mapToSchema(raw: unknown) { return []; }
  async handleWebhook(payload: unknown) { /* TODO */ }
  async disconnect() { /* TODO */ }
}
