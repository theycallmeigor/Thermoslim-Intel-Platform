import { describe, it, expect } from 'vitest';
import { mapLoopMetricToEventType, mapLoopEventToSubscriptionUpdate } from '../sync-loop-events';

describe('mapLoopMetricToEventType', () => {
  it('maps loop_subscription_started → CREATED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_started')).toBe('CREATED');
  });
  it('maps loop_order_processed → BILLED', () => {
    expect(mapLoopMetricToEventType('loop_order_processed')).toBe('BILLED');
  });
  it('maps loop_billing_attempt_failed → DECLINED', () => {
    expect(mapLoopMetricToEventType('loop_billing_attempt_failed')).toBe('DECLINED');
  });
  it('maps loop_billing_attempt_failed_and_will_be_retried → DECLINED', () => {
    expect(mapLoopMetricToEventType('loop_billing_attempt_failed_and_will_be_retried')).toBe('DECLINED');
  });
  it('maps loop_billing_attempt_failed_and_last_retry_left → DECLINED', () => {
    expect(mapLoopMetricToEventType('loop_billing_attempt_failed_and_last_retry_left')).toBe('DECLINED');
  });
  it('maps loop_subscription_cancelled → CANCELLED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_cancelled')).toBe('CANCELLED');
  });
  it('maps loop_subscription_paused → PAUSED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_paused')).toBe('PAUSED');
  });
  it('maps loop_subscription_resumed → RESUMED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_resumed')).toBe('RESUMED');
  });
  it('maps loop_subscription_reactivated → REACTIVATED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_reactivated')).toBe('REACTIVATED');
  });
  it('maps loop_subscription_expired → EXPIRED', () => {
    expect(mapLoopMetricToEventType('loop_subscription_expired')).toBe('EXPIRED');
  });
  it('maps loop_order_skipped → SKIPPED', () => {
    expect(mapLoopMetricToEventType('loop_order_skipped')).toBe('SKIPPED');
  });
  it('returns null for unmapped events', () => {
    expect(mapLoopMetricToEventType('loop_upcoming_order')).toBeNull();
  });
});

describe('mapLoopEventToSubscriptionUpdate', () => {
  const eventDate = new Date('2026-03-15T10:30:00Z');

  it('returns status ACTIVE for CREATED', () => {
    const result = mapLoopEventToSubscriptionUpdate('CREATED', {}, eventDate);
    expect(result).toEqual({ status: 'ACTIVE' });
  });
  it('returns CANCELLED with real occurredAt timestamp and cancelReason', () => {
    const result = mapLoopEventToSubscriptionUpdate('CANCELLED', { cancel_reason: 'Too expensive' }, eventDate);
    expect(result!.status).toBe('CANCELLED');
    expect(result!.cancelledAt).toEqual(eventDate);
    expect(result!.cancelReason).toBe('Too expensive');
  });
  it('returns PAUSED status', () => {
    const result = mapLoopEventToSubscriptionUpdate('PAUSED', {}, eventDate);
    expect(result).toEqual({ status: 'PAUSED' });
  });
  it('returns ACTIVE for RESUMED', () => {
    const result = mapLoopEventToSubscriptionUpdate('RESUMED', {}, eventDate);
    expect(result).toEqual({ status: 'ACTIVE' });
  });
  it('returns ACTIVE for REACTIVATED', () => {
    const result = mapLoopEventToSubscriptionUpdate('REACTIVATED', {}, eventDate);
    expect(result).toEqual({ status: 'ACTIVE' });
  });
  it('returns CANCELLED with "Subscription expired" for EXPIRED', () => {
    const result = mapLoopEventToSubscriptionUpdate('EXPIRED', {}, eventDate);
    expect(result!.status).toBe('CANCELLED');
    expect(result!.cancelledAt).toEqual(eventDate);
    expect(result!.cancelReason).toBe('Subscription expired');
  });
  it('returns lastBilledAt with event timestamp for BILLED', () => {
    const result = mapLoopEventToSubscriptionUpdate('BILLED', {}, eventDate);
    expect(result!.lastBilledAt).toEqual(eventDate);
  });
  it('returns null for SKIPPED (no status change)', () => {
    const result = mapLoopEventToSubscriptionUpdate('SKIPPED', {}, eventDate);
    expect(result).toBeNull();
  });
  it('returns null for DECLINED (no subscription status change)', () => {
    const result = mapLoopEventToSubscriptionUpdate('DECLINED', { decline_reason: 'Card expired' }, eventDate);
    expect(result).toBeNull();
  });
});
