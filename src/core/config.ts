// Centralized config — never import process.env directly elsewhere
export const config = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    url: process.env.REDIS_URL!,
  },
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecret: process.env.SHOPIFY_API_SECRET!,
    storeUrl: process.env.SHOPIFY_STORE_URL!,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
  },
  checkoutChamp: {
    apiUrl: process.env.CC_API_URL!,
    apiKey: process.env.CC_API_KEY!,
    apiUsername: process.env.CC_API_USERNAME!,
    webhookSecret: process.env.CC_WEBHOOK_SECRET!,
  },
  proxy: {
    quoteguardUrl: process.env.QUOTEGUARD_URL || '',
  },
  klaviyo: {
    apiKey: process.env.KLAVIYO_API_KEY!,
  },
  ga4: {
    propertyId: process.env.GA4_PROPERTY_ID!,
    credentialsJson: process.env.GA4_CREDENTIALS_JSON!,
  },
  clarity: {
    token: process.env.CLARITY_TOKEN!,
    projectId: process.env.CLARITY_PROJECT_ID || '2702654487149580',
  },
  notifications: {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    alertEmailFrom: process.env.ALERT_EMAIL_FROM,
  },
} as const;
