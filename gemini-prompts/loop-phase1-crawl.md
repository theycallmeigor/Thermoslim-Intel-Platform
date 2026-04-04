# Phase 1: Loop Subscriptions Help Doc Crawl

## Your Role

You are the research and knowledge enrichment engine for the ThermoSlim Commerce Intelligence Platform. You research, document, and organize — you do not write code. Your task is to systematically crawl the Loop Subscriptions help center and save every article as a structured markdown file for future retrieval.

## Context

ThermoSlim is integrating Loop Subscriptions as a new data source. Before building the adapter, we need a complete local copy of Loop's documentation. This is Phase 1 of a 4-phase research pipeline. Your output feeds into Phase 2 (API research), Phase 3 (analytics audit), and Phase 4 (integration spec).

## Input

- Loop help center: `https://help.loopwork.co/en/`
- 15 collections, ~161 articles total

## Instructions

### Step 1: Fetch Collection Index

Fetch the help center homepage and confirm these 15 collection URLs. **If the collection structure differs from this table** (collections added, removed, or renamed), document the differences in `_CRAWL_LOG.md` and proceed with the actual structure. The numbered folder scheme should follow the order found on the live site.

| # | Collection | URL | Expected Articles |
|---|-----------|-----|-------------------|
| 01 | Getting Started | https://help.loopwork.co/en/collections/15579415-getting-started | 3 |
| 02 | Developer Hub | https://help.loopwork.co/en/collections/16281606-developer-hub | 3 |
| 03 | Migration | https://help.loopwork.co/en/collections/16281641-migration | 11 |
| 04 | Analytics | https://help.loopwork.co/en/collections/16281645-analytics | 6 |
| 05 | Campaigns | https://help.loopwork.co/en/collections/16512330-campaigns | 4 |
| 06 | Acquire | https://help.loopwork.co/en/collections/16281657-acquire | 19 |
| 07 | Bundles | https://help.loopwork.co/en/collections/16281659-bundles | 8 |
| 08 | Grow | https://help.loopwork.co/en/collections/16281676-grow | 2 |
| 09 | Retain | https://help.loopwork.co/en/collections/16281682-retain | 18 |
| 10 | Experiments | https://help.loopwork.co/en/collections/17069199-experiments | 1 |
| 11 | Integrations | https://help.loopwork.co/en/collections/16281687-integrations | 40 |
| 12 | Customer Portal | https://help.loopwork.co/en/collections/16281691-customer-portal | 19 |
| 13 | Manage Subscriptions | https://help.loopwork.co/en/collections/16281692-manage-subscriptions | 10 |
| 14 | Settings | https://help.loopwork.co/en/collections/16281693-settings | 12 |
| 15 | FAQ | https://help.loopwork.co/en/collections/16646422-frequently-asked-questions-faqs | 15 |

### Step 2: Crawl in Priority Order

Fetch articles in this order (most critical for integration first):

1. **02-developer-hub/** — API docs, webhooks (3 articles)
2. **04-analytics/** — analytics metrics (6 articles)
3. **09-retain/** — cancellation flows, payment recovery (18 articles)
4. **06-acquire/** — selling plans, subscription models (19 articles)
5. **13-manage-subscriptions/** — subscription management (10 articles)
6. **12-customer-portal/** — customer actions (19 articles)
7. **14-settings/** — configuration (12 articles)
8. **11-integrations/** — third-party integrations (40 articles)
9. **05-campaigns/** — campaigns (4 articles)
10. **07-bundles/** — bundles (8 articles)
11. **08-grow/** — growth features (2 articles)
12. **01-getting-started/** — onboarding (3 articles)
13. **03-migration/** — migration guides (11 articles)
14. **10-experiments/** — experiments (1 article)
15. **15-faq/** — FAQs (15 articles)

### Step 3: For Each Collection

1. Fetch the collection page to discover all article URLs
2. For each article URL, fetch the full article page
3. Extract:
   - **Title** — the article heading
   - **Content body** — full article text, stripped of site navigation and chrome
   - **Code snippets** — preserve any JSON payloads, API examples, code blocks
   - **External links** — note any links to external API docs, Shopify docs, etc.
   - **Images/diagrams** — describe any images you see (screenshots, flowcharts, diagrams). Note what they show.
4. Save as `docs/integrations/loop-subscriptions/knowledge-base/{category-folder}/{article-slug}.md`

### Step 4: Article File Format

Each article file should follow this format:

```markdown
---
title: "{Article Title}"
source_url: "{Full article URL}"
collection: "{Collection name}"
scraped_at: "2026-03-30"
tags: [loop-subscriptions, {collection-slug}]
---

# {Article Title}

{Full article content in clean markdown}

## External Links Found

- {Any external URLs mentioned in the article}

## Images/Diagrams

- {Description of any visual content}
```

### Step 4b: Handle Empty/Truncated Content

Loop uses Intercom for their help center, which sometimes loads content via JavaScript. If an article fetch returns empty or truncated content:

1. Try fetching the article's JSON endpoint (Intercom pattern: append `?format=json` or check for `/api/articles/{id}` endpoints)
2. If still empty, try the article URL with a different user agent
3. Log any articles that return empty content to `_CRAWL_LOG.md` with the note "JS-rendered content — manual review needed"
4. Save whatever partial content you got — even a title-only stub is better than nothing

### Step 5: Build Index

After crawling all articles, create `docs/integrations/loop-subscriptions/knowledge-base/_INDEX.md`:

```markdown
# Loop Subscriptions Knowledge Base Index

**Source:** https://help.loopwork.co/en/
**Crawled:** 2026-03-30
**Total articles:** {actual count}
**Expected articles:** 161

## Articles by Collection

### 01 — Getting Started ({count})
| Title | File | Summary |
|-------|------|---------|
| ... | ... | ... |

### 02 — Developer Hub ({count})
...
{repeat for all 15 collections}

## Crawl Statistics

- Total fetched: {count}
- Total failed: {count}
- Coverage: {percentage}
```

### Step 6: Log Failures

Any article that fails to fetch gets logged to `docs/integrations/loop-subscriptions/knowledge-base/_CRAWL_LOG.md`:

```markdown
# Crawl Log

## Failed Fetches

| URL | Collection | Error | Timestamp |
|-----|-----------|-------|-----------|
| ... | ... | ... | ... |

## Notes

{Any observations about the crawl — articles that redirect, collections with different counts than expected, etc.}
```

### Step 7: Obsidian Sync

Copy `_INDEX.md` to `/Users/igordviniatin/Documents/CROMaxLabs/thermoslim-platform/adapters/loop/_INDEX.md` and add YAML frontmatter:

```yaml
---
title: Loop Subscriptions Knowledge Base Index
tags: [adapter/loop, reference, knowledge-base]
created: 2026-03-30
status: draft
related:
  - "[[Loop Subscriptions Adapter]]"
---
```

Convert any plain markdown links to `[[wikilinks]]` where they reference other files in the vault.

## Output Checklist

Before finishing, verify:

- [ ] All 15 collection folders have articles in them
- [ ] Total article count is within ±5 of 161
- [ ] `_INDEX.md` exists with complete article listing
- [ ] `_CRAWL_LOG.md` exists (even if empty — note "no failures")
- [ ] Every article file has YAML frontmatter with `title`, `source_url`, `collection`, `scraped_at`
- [ ] Developer Hub articles (priority 1) contain API/webhook details
- [ ] Obsidian copy of `_INDEX.md` exists at the specified path
- [ ] Report final count: "{X} articles crawled, {Y} failed, {Z}% coverage"

## Quality Checks

- No placeholder content — every article has real extracted content or an explicit "FETCH FAILED — see _CRAWL_LOG.md" marker
- Code blocks are preserved with correct syntax highlighting markers
- External links are collected in each article's "External Links Found" section
- Article slugs match the URL slugs from help.loopwork.co for traceability
