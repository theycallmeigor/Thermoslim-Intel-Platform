# Email + lifecycle module

## Location
`src/modules/email-lifecycle/`

## Responsibilities

### Attribution
- Match Klaviyo email events to CC orders
- Window: customer received email → opened → clicked → placed order within X hours
- Build own attribution model (more trustworthy than Klaviyo's built-in)

### Engagement scoring
- Per-subscriber score combining: email open recency, click recency, email frequency tolerance
- Combined with CC subscription status: active subscriber with declining engagement = churn risk

### Flow performance tied to outcomes
- Not just "winback flow recovered $500" but "subscribers recovered by winback have X% churn rate at cycle 4"
- Welcome series impact: does a strong welcome series improve long-term retention?

### Churn prediction signals
- Subscriber hasn't opened last 5 emails + billing cycle 3 = high churn risk
- Feed into alerts engine as at-risk subscriber list
