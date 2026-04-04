```markdown
# Design System Specification: High-Density Intelligence

## 1. Overview & Creative North Star
**Creative North Star: The Obsidian Command Center**

This design system is engineered to transform raw e-commerce data into a high-end, editorial experience. We are moving away from the "generic SaaS dashboard" look by embracing **Obsidian Command Center** aesthetics: a world of deep monochromatic depth, surgical precision, and intentional high-density layouts.

The system breaks the "template" feel by utilizing **Tonal Layering** instead of structural borders. By using overlapping surfaces and varying levels of dark-mode luminosity, we create a UI that feels carved from a single block of glass. We prioritize an authoritative typographic scale and "breathing" data points, ensuring that even at high density, the intelligence remains legible and premium.

---

### 2. Colors & Surface Architecture

The palette is rooted in deep obsidian tones, utilizing the primary blue and semantic accents to provide surgical focus points against a sophisticated dark backdrop.

*   **Primary (Action/Focus):** `primary` (#adc6ff) - Use for critical calls to action and active states.
*   **Revenue/Success:** `tertiary` (#4cd7f6) - A sophisticated cyan-leaning green for growth metrics.
*   **Retention/New Subs:** `secondary` (#d0bcff) - A royal purple for high-value customer actions.
*   **Rebills/Operational:** `on_secondary_container` (#c4abff) - Subtle amber/orange tones.
*   **Cancellations/Risk:** `error` (#ffb4ab) - A desaturated, premium red.

#### The "No-Line" Rule
To achieve a high-end editorial look, **1px solid borders for sectioning are strictly prohibited.** Do not use lines to separate a sidebar from a main content area. Instead, boundaries must be defined through background color shifts.
*   *Example:* A `surface-container-low` (#161c28) sidebar sitting against a `surface` (#0e131f) root.

#### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. Use the following tiers to define importance:
*   **Level 0 (Root):** `surface` (#0e131f) — The base canvas.
*   **Level 1 (Sections):** `surface-container-low` (#161c28) — Global navigation or sidebar regions.
*   **Level 2 (Primary Cards):** `surface-container` (#1a202c) — The main data containers.
*   **Level 3 (Interactive Elements):** `surface-container-high` (#242a36) — Popovers or hovered states.

#### The "Glass & Gradient" Rule
For floating elements (modals, tooltips), use **Glassmorphism**. Apply `surface_variant` (#2f3542) at 60% opacity with a `backdrop-blur` of 12px. Main action buttons should utilize a subtle linear gradient from `primary` (#adc6ff) to `primary_container` (#4d8eff) to add three-dimensional "soul."

---

### 3. Typography: The Editorial Edge

The typography system relies on **Inter** (System Font) but uses extreme weight and casing contrast to establish authority.

*   **Display & Headline (KPIs):** Use `headline-lg` (2rem) or `display-sm` (2.25rem). These should be `font-bold` and tightly tracked (-0.02em) to feel impactful and "heavy."
*   **Labels (The "Data Tag"):** All labels use `label-sm` (0.6875rem), `font-medium`, `uppercase`, and `tracking-wider`. This mimics the look of technical documentation or high-end watch faces.
*   **Body:** `body-md` (0.875rem) for standard text. Never use pure white; use `on_surface_variant` (#c2c6d6) to reduce eye strain and maintain the "dark" aesthetic.

---

### 4. Elevation & Depth: Tonal Layering

We discard traditional drop shadows in favor of **Ambient Luminosity**.

*   **Layering Principle:** Depth is achieved by placing a darker surface on a lighter one, or vice-versa. To lift a card, move it from `surface-container` to `surface-container-highest`.
*   **The Ghost Border Fallback:** If a container requires a boundary for accessibility (e.g., in high-density tables), use a **Ghost Border**. Apply `outline_variant` (#424754) at **15% opacity**. It should be felt, not seen.
*   **Ambient Shadows:** For floating menus, use a 24px blur shadow with the color `#000000` at 40% opacity, constrained tightly to the object to mimic a close-range light source.

---

### 5. Primitive Components

#### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text. No border. Rounded `xl` (0.75rem).
*   **Secondary:** Ghost style. No fill, `ghost-border` (15% opacity `outline`), `primary` text.
*   **Tertiary:** Text only, `uppercase`, `tracking-wider`, `label-md`.

#### Cards & Data Grids
*   **Rule:** Forbid divider lines within cards.
*   **Implementation:** Use `Spacing 4` (0.9rem) or `Spacing 5` (1.1rem) to create clear vertical groupings. To separate header from body, use a subtle background shift (e.g., `surface-container-highest` for the header bar).

#### Chips (Status Indicators)
*   Used for "Active," "Pending," or "Paused" subscriptions.
*   **Style:** Small, `rounded-full`, using `secondary_container` (#571bc1) with `on_secondary_container` (#c4abff) text.

#### KPIs (Intelligence Blocks)
*   A KPI block consists of a `label-sm` uppercase title, a `headline-lg` value, and a `tertiary` (cyan) or `error` (red) percentage trend indicator. Overlap the trend indicator slightly over the card’s corner for an asymmetrical, custom feel.

---

### 6. Do’s and Don’ts

#### Do
*   **Do** use asymmetrical layouts. A sidebar can be narrower than a standard grid to allow the data to take center stage.
*   **Do** lean into high-contrast text. A bold 32px number next to a light 10px label creates instant hierarchy.
*   **Do** use `backdrop-blur` on the sidebar to allow background data to subtly peek through, creating a sense of depth.

#### Don’t
*   **Don’t use 1px dividers.** If you feel the need to separate two things, increase the spacing or change the background tone of one.
*   **Don’t use pure black (#000000) or pure white (#FFFFFF).** Use the `surface_container_lowest` (#080e1a) for blacks and `on_surface` (#dde2f3) for whites.
*   **Don’t use standard "Drop Shadows."** They look "cheap" in high-end dark modes. Use tonal shifts and ghost borders instead.
*   **Don’t crowd the KPIs.** Intelligence requires focus. Give the most important numbers 2x the white space (Spacing 8) compared to secondary data.```