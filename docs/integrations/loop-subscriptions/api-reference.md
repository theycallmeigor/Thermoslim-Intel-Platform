---
title: Loop Subscriptions API Reference
source: Phase 2 research
created: 2026-03-30
---

# Loop Subscriptions API Reference

## Authentication

Loop Subscriptions utilizes a REST-based interface split into two architectures: **Admin APIs** and **Storefront APIs**.

- **Admin APIs Authentication:** Requires an API token generated via the Loop Admin Portal (`Settings > Manage API tokens`). This token is used for broad administrative actions and acts with full platform access.
- **Storefront APIs Authentication:** Tailored for customer-specific actions within portal environments. They authenticate using a **session token** that natively expires after 24 hours. A fresh session token can be generated either via Customer details or requested by specific portal authentication links.
- **Headers:** Typically, the token should be passed in headers using the standard API token structure (e.g., `X-Loop-Token` or standard `Authorization: Bearer <TOKEN>`, *NOT FOUND — requires direct API exploration to verify exact header name*).

## Base URL
*NOT FOUND — requires direct API exploration* (Often `https://api.loopwork.co/v1/` or `https://server.loopwork.co/admin/`, but exact REST endpoint domain is omitted from index references. V1 APIs have been deprecated as of February 20, 2026, meaning `v2` or `unstable` domains may be in effect.)

## Admin API Endpoints

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions` | Read all subscriptions |
| GET | `/subscriptions/{id}` | Read subscription details |
| POST | `/subscriptions` | Create subscription (*Requires detailed schema exploration*) |
| POST | `/subscriptions/{id}/reschedule` | Reschedule subscription |
| POST | `/subscriptions/{id}/pause` | Pause Subscription |
| POST | `/subscriptions/{id}/resume` | Resume Subscription |
| POST | `/subscriptions/{id}/reactivate` | Reactivate cancelled Subscription |
| POST | `/subscriptions/{id}/cancel` | Cancel subscription |
| POST | `/subscriptions/{id}/expire` | Expire contract |

### Subscription Line Actions (Items)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `.../lines` | Add line |
| POST | `.../lines/add-once`| Add line once |
| PUT | `.../lines/{id}/swap`| Swap line on subscription |
| DELETE| `.../lines/{id}` | Remove line |
| PUT | `.../lines/bulk` | Bulk update lines |
| POST | `.../lines/remove-once` | Remove line once |
| PUT | `.../lines/{id}` | Edit line attributes |
| PUT | `.../lines/{id}/schedule` | Edit line schedule |

### Orders & Order Scheduling
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Read all past orders |
| GET | `/orders/scheduled` | Read all scheduled orders |
| GET | `/subscriptions/{id}/orders/schedule` | List order schedule for subscription |
| GET | `/subscriptions/{id}/orders/history` | List order history for subscription |
| POST | `/subscriptions/{id}/orders/charge-now` | Place order (Charge Now) |
| POST | `/subscriptions/{id}/orders/skip-next` | Skip next order |
| POST | `/subscriptions/{id}/orders/reschedule-future` | Reschedule future order |
| POST | `/orders/update-note` | Update order note |
| GET | `/orders/shopify/{id}`| Read subscription ID by Shopify order ID |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | Read all customers |
| GET | `/customers/{id}` | Read customer details |
| GET | `/customers/{id}/subscriptions` | Read subscriptions for customer |
| GET | `/customers/{id}/orders` | Read customer order history |
| POST | `/customers/session` | Generate session token |
| POST | `/customers/send-login-link` | Send login link |

### Selling Plans & Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/selling-plans` | List selling plan groups |
| GET | `/selling-plans/{id}/variants` | Fetch product variants mapped to a selling plan |
| GET | `/products` | List products |
| GET | `/products/selling-plan-groups` | List available selling plan groups for products |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhooks` | List active webhooks |
| POST | `/webhooks` | Subscribe to webhook |
| DELETE| `/webhooks/{id}` | Unsubscribe webhook |

### Additional Actions (Frequencies, Addresses, Payments, Discounts)
- **Frequencies**: GET `list-available-frequencies`, PUT `update-frequency`, POST `change-subscription-plan`
- **Discounts**: POST `add-discount`, PUT `update-discount`, DELETE `remove-discount`, DELETE `remove-all-discounts`
- **Addresses**: GET `list-addresses`, POST `create-address`, PUT `update-address`, PUT `update-shipping-method`
- **Payment Methods**: PUT `change-payment-method-on-subscription`, POST `add-backup-payment-method`, DELETE `remove-backup-payment-method`, POST `checkout`, POST `checkout-reactivate`
- **Retention**: GET `list-cancellation-reasons`, GET `fetch-cancellation-flow-logs`

## Storefront API Endpoints

The Storefront API focuses on providing individual portal-facing features directly to the customers. Common endpoints overlap with the Admin APIs but enforce strict token-per-customer session contexts.
- Include localized endpoints for: **Update Address, Swap Line, Upgrade Actions, Delay Order, Process Upsells, and Mystery Rewards**.

## Rate Limits
*NOT FOUND — requires direct API exploration*. Standard Shopify ecosystems implement bucketing techniques (e.g., 2 by 2 seconds) but Loop's specific internal limit thresholds on the `Admin API` are nested deeply inside the `Rate limits` ReadMe document not exposed in the directory tree.

## Pagination
Usually managed through standard REST pagination techniques like `pageInfo` object cursor keys, or generic `page` and `limit` URL parameters. Details are nested in the ReadMe `Pagination` document. (*NOT FOUND — requires direct API exploration*).

## Error Handling
Standard HTTP response codes are used. 
Failed integrations often surface as "Loop integration failed" related natively to incorrect tokens.
*Payloads and exact JSON schema for error logging — partially inferred, requires direct API exploration.*
