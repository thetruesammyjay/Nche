# Nche Design System

> A calm, evidence-first command surface for detecting account takeover in real time.

This document is the visual and interaction contract for Nche Command, the demo financial app, and the shared UI package. It is deliberately specific enough to implement without inventing a new visual language screen by screen.

## 1. Product character

Nche is security infrastructure for people who must make a high-consequence decision quickly. The interface should feel like a trusted analyst's desk: quiet, legible, measured, and precise. It must communicate urgency when risk is critical without turning the product into a theatrical “hacker” dashboard.

### North star

**Quiet analyst's desk on warm paper.**

Use the Seline Analytics direction from Refero as the starting reference: warm neutral surfaces, dark ink, restrained borders, compact data presentation, and typography that remains comfortable during long investigations. Borrow the information hierarchy and restraint, not the source site's branding.

### Design principles

1. **Evidence before decoration.** Every alert leads with what happened, when it happened, and why it matters.
2. **Calm by default, urgent by exception.** Most of the screen is neutral. Status colors are reserved for decisions and changes in risk.
3. **One glance, one decision.** A reviewer should understand the current risk, recommendation, and next action without opening a modal.
4. **Confidence without false certainty.** Use “recommended action” and “risk score”; do not imply that Nche is the institution's final authority.
5. **Progressive disclosure.** Show the short analyst explanation first and make machine evidence, model versions, and raw events available beside it.
6. **Cross-channel context.** Mobile, web, and USSD events share one timeline and one customer story.

## 2. Visual direction

### Overall feel

- Light-first product UI with a warm paper canvas.
- Dark navy/ink text rather than pure black for comfortable reading.
- White cards on a warm canvas; hairline borders define structure.
- Compact, editorial data density with generous breathing room around major decisions.
- Small-radius controls and medium-radius cards; avoid pill-shaped everything.
- No neon gradients, matrix rain, fake terminal chrome, or glassmorphism.
- Charts should explain a decision, not compete with it.

### Brand expression

Nche should feel Nigerian and operational through its examples and language, not through decorative flags or clichés. Use realistic channels (mobile, web, USSD), naira amounts, Nigerian cities, and institution-neutral pseudonymous references in demo content.

## 3. Color system

The palette is tokenized so the risk semantics remain consistent across the dashboard, simulator, and demo app. Colors must never be the only way a state is communicated; pair them with a label, icon, and text.

### Base tokens

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#FAFAF9` | App background / warm paper |
| `--surface` | `#FFFFFF` | Cards, panels, tables |
| `--surface-subtle` | `#F5F5F4` | Secondary panels, hover fill |
| `--surface-raised` | `#FFFFFF` | Elevated popovers and dialogs |
| `--ink` | `#17191C` | Primary text and headings |
| `--ink-muted` | `#52525B` | Secondary text |
| `--ink-subtle` | `#71717A` | Captions, metadata |
| `--border` | `#E7E5E4` | Default dividers and card borders |
| `--border-strong` | `#D6D3D1` | Focused or emphasized boundaries |
| `--navy` | `#172554` | Nche brand accent, links, selected navigation |
| `--navy-soft` | `#EFF6FF` | Soft brand background |

### Decision tokens

| Decision | Background | Foreground | Border | Meaning |
|---|---|---|---|---|
| `ALLOW` | `#F0FDF4` | `#166534` | `#BBF7D0` | Low risk; proceed |
| `CHALLENGE` | `#FFFBEB` | `#A16207` | `#FDE68A` | Additional verification |
| `REVIEW` | `#FFF7ED` | `#C2410C` | `#FED7AA` | Human analyst attention |
| `BLOCK` | `#FEF2F2` | `#B91C1C` | `#FECACA` | Stop the sensitive action |

Risk score bars use a continuous tint from green through amber to red, but the numeric score and level label always remain visible. Do not use red for ordinary errors or destructive UI unrelated to fraud risk.

### Optional dark command mode

Dark mode is an optional Nche Command setting, not the default demo look. Use it for a monitoring-room presentation only:

- Canvas `#101214`, surface `#181B1F`, raised surface `#20252B`.
- Primary text `#F4F4F5`, muted text `#A1A1AA`, border `#30343B`.
- Keep the same decision foregrounds and add accessible dark backgrounds rather than simply inverting light tokens.

## 4. Typography

Use a practical open-source stack so the product renders consistently during the hackathon:

```css
--font-sans: "Inter", "Segoe UI", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
```

If licensed brand fonts become available, Roobert may replace Inter for UI text. The layout must not depend on that substitution.

| Role | Size / line height | Weight | Notes |
|---|---:|---:|---|
| Page title | 28 / 34px | 650 | One per screen |
| Section title | 18 / 24px | 650 | Panel and card headings |
| Body | 14 / 22px | 400 | Default application copy |
| Compact body | 13 / 19px | 400 | Tables and dense metadata |
| Label | 11 / 16px | 650 | Uppercase only for short status labels |
| Score | 48 / 52px | 700 | Risk score hero; tabular numerals |
| Data / IDs | 12 / 18px | 450 | Use mono for IDs, timestamps, API values |

Use `font-variant-numeric: tabular-nums` for scores, amounts, timestamps, and table columns. Avoid all-caps paragraphs and decorative display fonts.

## 5. Layout and spacing

The base spacing unit is 4px. Prefer the following scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

### Command shell

- Desktop: 248px sidebar + flexible content area.
- Content max width: 1440px; center wide views inside the remaining area.
- Page padding: 32px desktop, 24px tablet, 16px mobile.
- Primary grid: 12 columns with 24px gutters.
- Dashboard cards: 16px internal padding; major decision card: 24px.
- Sidebar remains visually quiet; the active route uses a navy-tinted background and a 2px inset marker.

### Responsive behavior

- At `< 1024px`, collapse the sidebar to an icon rail or a drawer.
- At `< 768px`, stack dashboard columns, keep the score and decision at the top, and turn tables into labelled rows.
- Never hide evidence on mobile; move it below the analyst explanation.
- The attack simulator must remain usable at 375px width for a live phone-sized demo.

### Shape and elevation

- Card radius: 12px.
- Input and button radius: 8px.
- Badge radius: 999px only for compact status badges.
- Default shadow: none or `0 1px 2px rgb(23 25 28 / 0.04)`.
- Dialog/popover shadow: `0 16px 40px rgb(23 25 28 / 0.12)`.
- Use borders before shadows to establish hierarchy.

## 6. Information architecture

### Nche Command

The dashboard is for an analyst or institution operator.

1. **Overview** — active alerts, risk distribution, decisions over time, and model health.
2. **Alerts** — filterable queue with severity, institution, channel, decision, and age.
3. **Investigations** — customer/session case view with event sequence and evidence.
4. **Beneficiaries** — destination-account novelty and mule-risk signals.
5. **Evaluation** — rules vs behaviour model vs Nche metrics and scenario split.
6. **Settings** — institution thresholds, API credentials, SIM-risk provenance, and audit controls.

### Demo financial app

The demo app is intentionally simpler: login, account summary, transfer flow, and a visible “verification required” state. It should feel like a plausible Nigerian financial app without copying a real bank's brand.

### Attack simulator

The simulator exposes scenarios as clear actions: normal transfer, legitimate location change, and takeover sequence. Each action shows the event sent, API response, score change, and resulting institution decision.

## 7. Core components

All reusable components live in `packages/ui`. Components should expose semantic props rather than one-off color classes.

### Risk score hero

The most important object on an investigation screen.

- Numeric score from 0–100 with tabular numerals.
- Level label: Low, Medium, High, Critical.
- Decision badge: ALLOW, CHALLENGE, REVIEW, or BLOCK.
- One-sentence analyst explanation.
- Timestamp and model version in quiet metadata.
- Score ring/bar is supplementary; never show a gauge without the number.

### Event sequence timeline

Displays events chronologically with channel, device, relative time, and contribution. Suspicious transitions show elapsed time (for example, “42s later”) between events. A timeline item must remain understandable when color is disabled.

### Evidence list

Each evidence row contains signal name, observed value, comparison/baseline, contribution or weight, and a short interpretation. Expandable raw payload is available for technical users but closed by default.

### Decision badge

Use the exact uppercase decision text. Pair with an icon and a sentence in screen-reader text. Never abbreviate BLOCK to a symbol alone.

### Alert table

Columns: alert ID, pseudonymous customer, channel, risk score, decision, primary reason, created time, and status. On mobile, preserve the score, decision, reason, and time; expose the remaining fields in the detail row.

### Provenance chip

SIM intelligence and other enrichments must show their source explicitly:

```text
SIM Intelligence · SIMULATED
SIM Intelligence · NIBSS SIM SWAP SERVICE
SIM Intelligence · UNKNOWN
```

The chip must not imply that a simulated signal is production intelligence.

## 8. Interaction and motion

- Use 120–180ms transitions for hover, focus, and panel changes.
- Use 250–350ms for timeline updates and score changes.
- When a new attack event arrives, highlight the new row and score delta once; do not continuously pulse the whole page.
- BLOCK may use a brief red border transition, not flashing or sound by default.
- Respect `prefers-reduced-motion` and remove score animations when enabled.
- Every interactive element has visible keyboard focus using a 2px navy ring with a 2px offset.

## 9. Data visualization rules

- Use line charts for score/time and grouped bars for model comparison.
- Use a stacked distribution only when the segments have labels and exact values.
- Keep gridlines subtle (`--border`); label axes in plain language.
- Annotate the event that changed the decision.
- Never use a pie chart for more than five categories.
- Always provide a text/table equivalent for charts.
- Evaluation charts must distinguish target metrics from measured results.

## 10. Content and language

Voice is direct, respectful, and operational. Explain what Nche observed rather than accusing a customer of fraud.

Prefer:

> “A new device login was followed by a password reset and a first-time beneficiary within 64 seconds.”

Avoid:

> “This customer is a fraudster.”

Use “recommended action” in API-facing and analyst-facing copy. Use “institution decision” when describing the final authorization step. Preserve pseudonymous IDs such as `customer_7fd9a2` in the UI and demos.

### Decision copy

- ALLOW: “No material risk signal detected. Proceed according to institution policy.”
- CHALLENGE: “Ask for additional verification before completing this action.”
- REVIEW: “Hold for analyst review. The sequence is unusual for this customer.”
- BLOCK: “Stop this action. The evidence strongly matches an account-takeover sequence.”

## 11. Accessibility and trust

- Meet WCAG AA contrast for text and controls.
- Do not encode risk by color alone; include text, icon, and accessible labels.
- All tables have headers and keyboard navigation.
- All charts have summaries and data tables.
- Error messages identify the failed action and recovery path.
- Avoid exposing raw account numbers, names, phone numbers, or other identity data in screenshots and fixtures.
- Show model version, timestamp, and signal provenance where a decision is displayed.

## 12. Implementation tokens

The shared UI package should expose these tokens through Tailwind/CSS variables. Keep component styles token-based so the demo app and Nche Command cannot drift.

```css
:root {
  --canvas: #fafaf9;
  --surface: #ffffff;
  --surface-subtle: #f5f5f4;
  --ink: #17191c;
  --ink-muted: #52525b;
  --ink-subtle: #71717a;
  --border: #e7e5e4;
  --border-strong: #d6d3d1;
  --brand: #172554;
  --brand-soft: #eff6ff;
  --allow: #166534;
  --allow-bg: #f0fdf4;
  --challenge: #a16207;
  --challenge-bg: #fffbeb;
  --review: #c2410c;
  --review-bg: #fff7ed;
  --block: #b91c1c;
  --block-bg: #fef2f2;
  --radius-card: 12px;
  --radius-control: 8px;
}
```

## 13. Definition of done for a screen

Before shipping a new screen, verify:

- The primary decision or task is visible without scrolling on desktop.
- Risk state is communicated with text, not only color.
- Evidence can be traced to a timestamped event.
- Loading, empty, error, and permission states exist.
- Mobile layout works without horizontal scrolling.
- Pseudonymous fixtures are used in screenshots and tests.
- Copy describes observed evidence and preserves institution authority.
- The screen uses shared tokens and components from `packages/ui`.
