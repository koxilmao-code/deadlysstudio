# Simpler dashboard that looks like the front page

## Goal
A new creator opens the dashboard and immediately understands it: big clear numbers, simple graphs like the front page, no empty "—" boxes, plain-English labels.

## What changes

1. **Same look as the front page**
   - Use the front page's top bar (logo, links, sign in/out) instead of the separate dashboard header.
   - Big section titles with the small "01 / ..." labels, generous spacing, rounded dark cards.
   - Shorter side menu grouped into 3 headings: **My games** (Overview, Analytics, Revenue), **Discover** (Trending, Compare games, Marketplace), **Creative** (Thumbnails & trailers, Icon Studio, A/B tests), plus Plan. On phones it becomes a simple scrolling tab row.

2. **Overview becomes a "home" page**
   - If no games yet: one friendly step-by-step card ("1. Add your Roblox game, 2. We start tracking, 3. Check back for graphs") with the add form right there.
   - If games exist: each game shown as a card with its icon, players online now, visits, and a small 24h graph — the same card style as the front page Live Charts.
   - Plan and credits shown as one short line, not four boxes.

3. **Analytics page: only show what has data**
   - Hide any number or graph with no readings instead of showing "—" or empty boxes.
   - Show one short note for missing data: "Retention and revenue need your Roblox game connected — coming soon" instead of many blank stats.
   - Graphs reuse the exact front page graph (big number on top, one line, hover for value).
   - Each stat gets a one-line plain explanation (e.g. "Players online — how many people are in your game right now").
   - A small "Tracking since <date>" badge so users understand why long ranges look short.

4. **Revenue and Performance**
   - Revenue: show the estimated revenue graph only when available, otherwise one clear explanation card.
   - Performance: replace the table of percentages with simple up/down arrows and words ("Players: up 12% this week").

5. **Check it works**
   - Open the dashboard signed in as your account on desktop and phone size, with and without games, and screenshot each page.

## Not changing
Plans, prices, who can see what, billing, the staff workspace permissions, and the data collection itself.

## Technical details
- Replace `ExchangeLayout` header with `PublicChrome` nav; grouped NAV config.
- `kit.tsx`: new `MetricCard` (value + hint + `LineCard`), `EmptyHint`; `Stat` callers filtered by non-null values.
- `Overview.tsx`: onboarding state + game cards using `useSnapshots(game, 24h)`.
- `Insights.tsx`: filter null metrics, add descriptions map, "tracking since" from first snapshot, performance arrows.
