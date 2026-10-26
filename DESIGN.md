# SpecTide Design System

**Version:** 1.0  
**Source of truth:** `SpecTide_Full_PRD_v1.1_Multi_Project.md` for product behavior; `index.html` for the visual reference and token values.  
**Product:** a local-first, multi-project orchestration and evidence workspace for spec-driven development.

## 1. Design position

SpecTide should feel like a calm engineering instrument: precise, inspectable, and never theatrical. It is not an agent chat surface or an enterprise control tower. The UI's job is to make the current operational truth obvious:

1. What is running, for which project, and in which isolated worktree?
2. Which provider/profile is acting and what may it do?
3. Is user input or approval required?
4. What requirement-level evidence is current, partial, failed, or missing?
5. What is the safest useful next action?

### Product principles expressed in the UI

- **Evidence over claims.** Agent output is activity, not proof. Evidence, check results, source revision, provenance, and freshness must remain visible.
- **Scope is safety.** Project, run, branch, worktree, and command scope are concrete UI data—not hidden metadata.
- **Local-first is tangible.** Name local paths, loopback connectivity, retained artifacts, and preserved worktrees plainly.
- **Progressive disclosure.** The default path is start → observe → review. Routing, budget, policy, and advanced diagnostics expand only when needed.
- **Quiet chrome; meaningful colour.** Blue denotes selection or data focus. Semantic colours communicate a state and always appear with words and a shape/mark.
- **Truthful automation.** Never imply completion, cost, verification, or safety that has not been independently observed.

### Chosen visual direction

Use the **tinted frame / white sheet** pattern already demonstrated in `index.html`: a pale blue-grey L-frame holds a white working sheet. It suits a local developer tool because it keeps the work area quiet, clearly distinguishes workspace chrome from project content, and uses the product's “tide” blue only for active information.

The signature product element is the **evidence ledger**: requirement rows that connect a stable ID to implementation, checks, provenance, freshness, state, and a next action. This is more characteristic of SpecTide than generic charts or vanity KPIs.

## 2. Information architecture

The persistent sidebar contains exactly four primary destinations:

| Destination | Primary question | Core content |
| --- | --- | --- |
| All Projects | Where does work need attention? | Project table, global activity, global approvals, capacity/queue state |
| Runs | What is a run doing now? | Workflow timeline, agent/profile, live events, logs, diff, checkpoints |
| Evidence | What is actually verified? | Requirement ledger, checks, freshness, gaps, report/export |
| Settings | What policy governs this project? | Trust, profiles, test commands, concurrency, retention, safety policy |

The top header persistently exposes the project scope selector (`All projects` or one registered project), search, help/shortcuts, and local workspace identity. Scope selection changes visible data only; it must never silently retarget a mutating action.

### Routing and scope rules

- Every mutating screen and confirmation names the **project**, canonical repository path, run ID, and worktree/branch where relevant.
- A global inbox may aggregate approvals, but every item has a prominent project label and opens inside that project's run.
- Do not show project-A data in a project-B detail view. A stale or invalid route shows a scoped “Run not found in this project” state rather than attempting a fallback.
- “All Projects” is the default landing view. It is a monitoring view; a new run always requires an explicit target project.

## 3. Foundations

### 3.1 Color tokens

These are the implementation tokens from `index.html`. Use token names rather than raw hex values in application components.

| Token | Value | Purpose |
| --- | --- | --- |
| `--ground` | `#F9FBFC` | Page ground where a sheet is not present |
| `--frame` | `#EDF3F7` | App frame, sidebar, and top bar |
| `--surface` | `#FFFFFF` | Sheet, panel, control interior |
| `--raised` | `#F4F6F8` | Quiet inset, callout, code background |
| `--active` | `#E9EDF0` | Selected neutral navigation/row state |
| `--border` | `#E3E8EB` | Panel and surface boundary |
| `--rule` | `#EDF0F2` | Low-emphasis row divider |
| `--control` | `#C8D0D6` | Interactive control border |
| `--ink` | `#17212B` | Primary text and near-black action |
| `--muted` | `#566575` | Secondary text |
| `--quiet` | `#657482` | Tertiary text and placeholders |
| `--accent` | `#2F70BB` | Selected data, active nav icon/tab, links, current stage |
| `--accent-soft` | `#EAF3FB` | Selected filter/chip background |
| `--positive` | `#176447` | Verified/succeeded/running-success semantic ink |
| `--positive-bg` | `#E8F4ED` | Positive semantic background |
| `--warning` | `#76540C` | Review, pause, partial, or attention semantic ink |
| `--warning-bg` | `#FFF4DC` | Warning semantic background |
| `--negative` | `#963B3B` | Failed/cancel/destructive semantic ink |
| `--negative-bg` | `#FBECEC` | Negative semantic background |
| `--neutral-ink` | `#394551` | Queued and neutral status ink |
| `--neutral-bg` | `#E9EDF0` | Queued and neutral status background |

Use the accent sparingly: selected navigation, the active tab underline, links, the current-stage ring, and the main data mark. Do not make the sidebar dark, turn every button blue, or use status colours decoratively.

### 3.2 Typography

| Role | Family | Size / line height | Weight | Use |
| --- | --- | --- | --- | --- |
| UI text | IBM Plex Sans, `Avenir Next`, system sans | 14px / 1.5 | 400 | Default body, cells, controls |
| Page title | Same | 22px / 1.25 | 600 | One `h1` per screen |
| Section title | Same | 16px / 1.35 | 600 | Panel and page section headings |
| Item title | Same | 14px / 1.4 | 500–600 | Requirement, run, project, action labels |
| Meta | Same | 12px / 1.5 | 400–500 | Timestamps, source labels, descriptions |
| KPI | Same | 28px / 1.15 | 400 | A small number of summary values |
| Code / identifiers | IBM Plex Mono, system mono | 12–14px / 1.5 | 400–500 | IDs, paths, hashes, commands, structured output |

Apply `font-variant-numeric: tabular-nums` to counts, times, test results, and all table numerics. Use mono for identifiers and code—not for normal prose. Sentence case is the default; do not use loud uppercase table headers.

### 3.3 Spacing, shape, and elevation

| Token | Value | Typical use |
| --- | --- | --- |
| `--space-1` | 4px | Icon/text nudge, fine internal gaps |
| `--space-2` | 8px | Compact action groups |
| `--space-3` | 12px | Field label gaps, dense components |
| `--space-4` | 16px | Panel padding and regular grid gap |
| `--space-5` | 20px | Default panel body padding |
| `--space-6` | 24px | Section/panel gap |
| `--space-8` | 32px | Major section separation |
| `--space-10` | 40px | Page rhythm where needed |

- Control radius: `6px`; panels: `8px`; main working sheet: `16px`.
- Resting surfaces use a **hairline or tone step**, never a hairline plus a shadow.
- `0 16px 48px rgb(20 35 48 / 18%)` is reserved for modal dialogs and other floating layers.
- Use one 16px grid gap per local layout. Avoid cards with large unexplained empty bands.

## 4. Application shell and responsive layout

### Desktop

- Sidebar: 228px; top bar: 48px.
- The sidebar and top bar share `--frame`; the content sheet begins 8px from the window's right and bottom edge.
- The sheet has a 1px `--border`, 16px radius, no resting shadow, and a centered content maximum of 1600px.
- Content padding: `30px clamp(20px, 3vw, 40px) 48px`.
- Use a two-column run/evidence layout only when the secondary column remains at least 250–270px.

### Breakpoints

| Viewport | Behavior |
| --- | --- |
| >1100px | Full shell; sidebar may reduce to 196px at the lower end of this band. |
| 761–1100px | Fold or compact sidebar; maintain tables with key fields and move secondary metadata to a subline. Stack two panels when either becomes narrower than ~340px. |
| ≤760px | Replace sidebar with a 48px top bar plus a menu sheet or a labeled bottom nav. Sheet becomes edge-to-edge/near edge-to-edge with 16–20px page padding. Stack page actions, panels, and settings rows. |
| ≤460px | Keep one primary action visible; overflow secondary header actions. Convert KPI strip to a two-column grid or label/value list; never squeeze four columns. |

Tables become two-line rows below ~640px: identity and primary state/value remain on the first line, required metadata moves to the second. A table that must retain its columns scrolls inside its own frame; the page never scrolls horizontally.

## 5. Semantic model and status language

The UI must visually separate three distinct ideas: **execution state**, **stage state**, and **requirement verification**. Never use one badge to stand in for all three.

### 5.1 Execution state

| State | Display treatment | Meaning / default next action |
| --- | --- | --- |
| `CREATED`, `PREFLIGHT` | Neutral badge + explanatory copy | Preparing or validating; show project and checks in progress |
| `RUNNING`, `VERIFYING`, `REPAIRING` | Positive/active badge with dot + current action | Show stage, agent/profile, elapsed time, and Pause/Cancel |
| `PAUSED`, `WAITING_APPROVAL`, `WAITING_INPUT` | Warning badge + callout | Explain what is required; surface the exact approval/input action |
| `COMPLETED_VERIFIED` | Positive badge | Link to evidence report and diff |
| `COMPLETED_PARTIAL` | Warning badge | Link directly to unverified/partial requirements |
| `FAILED` | Negative badge | Explain preservation and offer safe recovery/checkpoint actions |
| `CANCELLED` | Neutral badge | Explain that worktree/changes remain available for review |

### 5.2 Stage state

`PENDING`, `READY`, `RUNNING`, `WAITING_APPROVAL`, `WAITING_INPUT`, `BLOCKED`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `SKIPPED`, and `STALE` appear in the workflow timeline. A timeline item includes an icon/shape, textual state, and optional owner/profile—never colour alone.

- Completed: checkmark in positive outlined circle.
- Current: accent ring and current-action copy.
- Future: empty neutral circle.
- Blocked/waiting: warning mark and the exact blocker.
- Failed: negative mark with “View details”.
- Stale: neutral/warning “Stale” label plus the invalidating change or revision.

### 5.3 Requirement verification state

| State | Badge label | Required supporting information |
| --- | --- | --- |
| `VERIFIED` | Verified | Current evidence and applicable source revision |
| `PARTIAL` | Partial | Which mandatory proof is incomplete and next action |
| `UNVERIFIED` | Unverified | Absence/reason; never a disguised success state |
| `FAILED` | Failed | Failed mandatory check or confirmed critical violation |
| `NOT_APPLICABLE` | Not applicable | Approved rationale and approver |

Evidence freshness is a property of evidence, not a requirement-state synonym. Show it independently: `Current`, `Stale since <revision/change>`, or `Not captured`.

Provenance is explicit interface data: `explicit`, `inferred`, or `manual`. Treat inferred associations as lower-confidence links, and give manual evidence the reviewer name and rationale. A reviewer or agent claim never upgrades a requirement to `VERIFIED` on its own.

## 6. Components

### 6.1 Buttons and links

| Component | Appearance | Appropriate use |
| --- | --- | --- |
| Primary button | 34px high, `--ink` fill, white text, 6px radius | One main action in a local context: `New Run`, `Start`, `Approve once` |
| Secondary / quiet button | White with `--border`, ink label | Supporting actions: `Review plan`, `See diff`, `Pause` |
| Text button | Accent text, no filled container | Inline navigation or lower-priority action: `View logs →` |
| Danger button | White, negative border/ink; negative background on hover | `Cancel run`, archive/unregister after confirmation |
| Icon button | 34px square, neutral ink, accessible label | Help, close, compact utilities—not the only representation of a destructive action |

Buttons include visible `:focus-visible`, enabled/disabled, hover, and pressed states. Disabled controls remain legible and state why they are unavailable. Use verbs that describe the concrete consequence: `Approve once`, not `Confirm`; `Repair failed tests`, not `Continue`.

### 6.2 Form controls

- Labels always sit above controls; placeholders never replace labels.
- Standard inputs/selects are 40px high; toolbar controls are 32–34px. Use 1px `--control` borders and 6px radius.
- Label → field: 6–8px. Fields: 16px apart. Supporting/help text is 12px `--muted`.
- Use a multiline requirement field in New Run. Prompt for behavior to be verified, not merely a task title.
- Selection chips are compact filters, not navigation. Their selected state uses an accent border + `--accent-soft` fill + label text.

### 6.3 Status badge

Status badges are 20–22px high, have 12px medium text, a pale semantic background, dark semantic text, and a 6px dot or equivalent mark. Include the label in every badge. Preserve `white-space: nowrap`.

### 6.4 Panels, metrics, lists, and tables

- Standard panel: 1px `--border`, 8px radius, `--surface` background; 16–20px padding.
- Panel header: 48px minimum height and an optional low-emphasis bottom rule.
- A summary/KPI group is one shared container split by vertical hairlines, not four decorative cards. Values are 28px at regular weight.
- Tables have 12px sentence-case, muted headers; no zebra striping or header fill; use `--rule` dividers. Numeric columns are right-aligned and tabular.
- A two-line identity cell has an ink primary name and a 12px muted path/context line.
- Use one status mark per row. Do not duplicate state as a badge plus an icon plus a coloured cell.
- Overview lists cap at 3–5 rows and link to the full destination rather than adding pagination.

### 6.5 Workflow timeline

Timeline rows are at least 42px high with three columns: state marker (24px), stage/task name, then owner/state metadata. Group adjacent low-level stages only when their separate current/failed state remains discoverable. Current action is repeated in plain language at the top of the run view.

### 6.6 Evidence ledger

The evidence page is the product's most important data table. Default columns:

1. Requirement ID + short description
2. Risk tier
3. Verification state
4. Implementation reference
5. Test/evidence reference
6. Provenance
7. Freshness
8. Reason / next action

Sort by: failed critical → unverified critical → stale → partial → verified. Selecting a row opens a right-side detail view at desktop or a pushed detail screen at mobile. It must include the source evidence, command/result where relevant, recorded revision, changed files, linkage source, and safe next action.

### 6.7 Approval card

An approval is an explicit security interaction, not a generic confirmation dialog. It must show:

- **What will happen** in plain language.
- Exact command/action, provider, project path, and isolated working directory.
- Why it requires elevated approval and potential side effects.
- The run/project ID and an explanation that the decision is bound to this exact action digest.
- `Approve once`, `Reject`, and `Inspect/Edit policy` as suitable.
- The no-action outcome: workflow stays paused; approval is never implied.

Changes to material arguments or paths invalidate the request and require a new approval.

### 6.8 Dialogs, notices, and toasts

- **New Run** opens as a dialog/sheet with a visible close control, focus management, and a run preview before start.
- **Notices** are in-context and concise: a 2px accent edge or semantic badge, title, explanation, and action. They do not replace a detail page.
- **Toast** messages confirm lightweight UI events only; never use them as the only surface for a failure, approval, security event, or a result that needs action.
- Floating layers use the float shadow and must return focus to their trigger on close.

## 7. Core product patterns

### 7.1 All Projects

**Question answered:** What requires attention across my registered repositories?

The first viewport contains:

- `All Projects` title, scope-aware search, `Add project`, and the single primary `New Run` action.
- A compact shared metric strip: registered, running, queued, needs attention.
- A projects table with name/path, run status, current activity + profile, verification coverage, latest run, and one action.
- Global activity and a scoped approvals/attention module.

Show raw coverage such as `7 / 8 mandatory requirements verified`; never invent a quality score. A project with no configured verification must state `Verification setup required`, not `Ready`.

### 7.2 New Run

The default sheet includes requirement, target project, workflow, and mode. Advanced controls collapse by default.

| Field | Default behavior |
| --- | --- |
| Requirement | Multiline; asks for desired behavior and acceptance criteria |
| Project | Explicit project name + canonical path; no recency guess |
| Workflow | Feature — Full SDD, Bug fix — Scoped, Review only, Continue existing feature |
| Mode | Auto, Guided, Custom |
| Preview | Worktree/branch, saved agent policy, configured checks, approval gates |
| Advanced | Provider/profile routing, effort, time/retry budgets, test strategy, risk level, workspace options |

If no usable test command is configured, show the warning before start and require an explicit validation strategy for an outcome to become verified.

### 7.3 Live run

**Question answered:** What is happening now, who is doing it, and what can I safely do?

Header: feature name, run state, `Pause` and `Cancel`. Under it, show project, run ID, branch, worktree, and last update. Main content uses a workflow timeline plus a current-action panel that names the stage, task, provider/profile, and live events. A persistent evidence summary shows verified/partial/unverified counts, blockers, and next action. Links expose logs and diff without making them the sole source of status.

### 7.4 Evidence report

Header includes outcome, coverage fraction, changed files/commit, executed checks and results, evidence freshness, known gaps, and one contextual next action. A passing process exit alone cannot set the overall outcome to Verified.

### 7.5 Settings

Use scannable settings rows: left column with title and plain-language consequence; right column with current value/control. Settings areas have their own views rather than one long anchor page. Put destructive registry actions last, name the affected project, explain retention/preservation, and require confirmation.

### 7.6 Empty, loading, error, and stale states

| State | Required treatment |
| --- | --- |
| Zero | Print the real zero (`0`, `0%`, `0 checks`); do not disguise it as missing |
| Missing/not applicable | Use a muted dash plus reason where needed |
| Empty list | Keep the panel title/frame and provide one sentence + relevant next action |
| First-run | Preserve shell and show the natural first action where content will appear |
| Loading | Preserve final geometry with flat skeleton bars at the final content sizes; no shimmer gradient |
| In-panel error | State what failed, what data/work is preserved, safe next action, and a details link/run ID |
| Stale evidence | Keep the old evidence reference but mark it stale, name the invalidating revision/change, and offer revalidation |

Error language follows: **what failed → what was preserved → safe next action → details**. Example: “Codex hit a usage limit during T-012. The worktree and previous passing checks are preserved. Resume with the same profile later, or select an already-authorized profile. View checkpoint.”

## 8. Content and data rules

- Use stable names: `Verified`, `Partial`, `Unverified`, `Failed`, `Not applicable`; do not replace them with vague praise such as “Good”.
- State the noun with the number: `3 active runs`, `1 approval`, `7 / 8 requirements verified`.
- Relative times are appropriate in activity feeds; use a full timestamp in event/log detail.
- Use ISO dates for comparable table values; use natural recency in activity (`2 min ago`).
- Show unknown cost as `Unavailable`, not `$0`. Label estimates and their source/assumptions.
- Say `agent reported success` when that is the evidence; reserve `Verified` for independently supported requirement evidence.
- Never put secrets, raw provider credentials, or unredacted sensitive output in the normal interface.

## 9. Accessibility and interaction requirements

- Target WCAG 2.2 AA-oriented contrast. Every text-bearing colour tier—including placeholders—must remain readable on its surface.
- Keyboard users can reach all navigation, fields, tabs, controls, dialog actions, row actions, and evidence details. Use visible 3px accent-derived focus rings with a 2px offset.
- Status always includes text and a non-colour mark. Icons have accessible names where they are controls; decorative icons are hidden from assistive technology.
- Native controls receive associated labels. Tabs follow the tablist pattern: arrow keys move focus/selection, only the active tab is in the normal tab sequence.
- The New Run modal traps focus while open, supports Escape, and restores focus on close.
- Touch targets are at least 44px on mobile even if desktop chrome uses 32–34px controls.
- Honour `prefers-reduced-motion`; interface motion is feedback only—no decorative entrance animation or meaning conveyed by motion alone.
- Announce meaningful status updates through restrained live regions; do not stream every log line to a screen reader.

## 10. Implementation starter tokens

```css
:root {
  --ground: #f9fbfc; --frame: #edf3f7; --surface: #fff; --raised: #f4f6f8;
  --active: #e9edf0; --border: #e3e8eb; --rule: #edf0f2; --control: #c8d0d6;
  --ink: #17212b; --muted: #566575; --quiet: #657482;
  --accent: #2f70bb; --accent-soft: #eaf3fb;
  --positive: #176447; --positive-bg: #e8f4ed;
  --warning: #76540c; --warning-bg: #fff4dc;
  --negative: #963b3b; --negative-bg: #fbecec;
  --neutral-ink: #394551; --neutral-bg: #e9edf0;
  --radius-control: 6px; --radius-card: 8px; --radius-sheet: 16px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --font-sans: "IBM Plex Sans", "Avenir Next", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --shadow-float: 0 16px 48px rgb(20 35 48 / 18%);
}

.num { font-variant-numeric: tabular-nums; }
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
:focus-visible { outline: 3px solid color-mix(in srgb, var(--accent) 48%, white); outline-offset: 2px; }
```

## 11. Design acceptance checklist

Before shipping a UI change, confirm:

- [ ] The current project/run scope is visible before a user can mutate anything.
- [ ] Execution status, stage status, verification state, freshness, and provenance are not conflated.
- [ ] Every essential state is understandable without colour.
- [ ] The screen's main operational question and safe next action are visible in the first viewport.
- [ ] Data values use real state, current scoped counts, tabular numbers, and no invented success/cost claim.
- [ ] Requirement coverage uses a fraction of applicable mandatory requirements—not a generic score.
- [ ] Running work identifies stage, agent/profile, worktree/branch where relevant, and last update.
- [ ] Approval surfaces show exact scope/action, rationale, side effects, expiration semantics, and no implicit approval path.
- [ ] Empty, zero, loading, error, and stale states are implemented for each data-bearing view.
- [ ] Desktop, tablet, and 390px mobile layouts preserve critical information and one clear action.
- [ ] Keyboard focus, labels, dialog behavior, and reduced-motion behavior have been checked.
- [ ] Resting surfaces have no decorative shadow; accent and semantic colours serve information rather than chrome.

## 12. Deliberate non-patterns

Do not introduce:

- A chat-first home screen that obscures the run/evidence model.
- Dark or saturated sidebars on this light application shell.
- Gradient cards, glow effects, glass panels, or decorative analytics imagery.
- KPI cards with tinted icon circles, sparklines, or fabricated growth deltas.
- Zebra tables, uppercase tracked headers, or left-aligned numerical columns.
- A generic green “Success” state standing in for verified requirements.
- A colour-only status, an approval without the exact command/path, or a silent cross-project fallback.
- Automation language that hides risk, missing checks, stale evidence, unavailable telemetry, or preserved work.
