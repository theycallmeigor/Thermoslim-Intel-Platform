# Design System Specification: The Intelligence Aesthetic

## 1. Overview & Creative North Star
**Creative North Star: "The Observational Monolith"**

In the world of high-velocity commerce, data is often chaotic. This design system is built to provide a sense of absolute control and editorial clarity. We move away from the "cluttered dashboard" trope and toward a "Command Center" aesthetic. 

By leveraging **Organic Brutalism**, we use heavy, purposeful typography scales and intentional asymmetry. We break the grid not by accident, but by using overlapping layers and varying "z-axis" depths. The interface should feel less like a software application and more like a high-end financial journal—authoritative, quiet, and profoundly deep.

---

## 2. Colors & Surface Philosophy

The palette is rooted in the "Midnight Blue" spectrum, using tonal shifts rather than structural lines to define space.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Layout boundaries must be defined through:
1.  **Background Color Shifts:** Use `surface-container-low` for secondary sections sitting on a `surface` root.
2.  **Tonal Transitions:** Define areas through subtle value changes in the gray-900 to gray-950 range.

### Surface Hierarchy (Nesting)
Treat the UI as a physical stack of materials.
*   **Root Level:** `surface` (#0e131f) — The base canvas.
*   **Secondary Level:** `surface-container` (#1a202c) — For main dashboard sections.
*   **Action Level:** `surface-container-high` (#242a36) — For interactive cards or hover states.
*   **Floating Level:** `surface-container-highest` (#2f3542) — For modals and slide-overs.

### Glass & Texture
*   **Glassmorphism:** Use `surface-variant` at 60% opacity with a `20px` backdrop-blur for floating navigation or tooltips.
*   **Signature Textures:** Hero KPIs should utilize a subtle linear gradient from `primary` (#adc6ff) to `primary-container` (#4d8eff) at a 135-degree angle to provide a "metallic" sheen.

---

## 3. Typography

The system uses a dual-font approach to balance editorial elegance with technical precision.

*   **Display & Headlines (Manrope):** High-character, geometric sans-serif. Use `display-lg` (3.5rem) for major revenue milestones and `headline-sm` (1.5rem) for section titles. The wide tracking in headlines conveys a sense of luxury and breathing room.
*   **Body & UI (Inter):** Maximum legibility for dense data.
    *   **KPI Values:** `text-2xl` (title-lg), font-bold, tracking-tight.
    *   **Labels:** `label-sm`, uppercase, tracking-wider (0.05em), using `on-surface-variant` (#c2c6d6).
    *   **Body Content:** `body-md` (0.875rem), `text-gray-300` for primary reading.

---

## 4. Elevation & Depth

We achieve hierarchy through **Tonal Layering** instead of structural scaffolding.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a "soft pocket" effect where content feels recessed or elevated naturally.
*   **Ambient Shadows:** For floating panels (like the 380px slide-over), use a shadow with a `40px` blur, 0% spread, and 6% opacity. The shadow color must be `on-surface` (#dde2f3) to simulate light catching the edges of the "glass."
*   **The Ghost Border:** If contrast is required for accessibility, use `outline-variant` (#424754) at 15% opacity. It should be felt, not seen.

---

## 5. Components

### High-Density Tables
*   **Rule:** Forbid horizontal divider lines between rows.
*   **Alternative:** Use a subtle `surface-container-low` background on even rows (zebra striping) and a `primary` (#3b82f6) vertical "whisper line" (2px wide) only on the active/hovered row.

### Slide-Over Panels (380px)
*   **Style:** Fixed width. Use `surface-container-highest` with a 20% `surface-tint` overlay. 
*   **Animation:** Use a "Slide and Scale" transition (the background dashboard scales down to 98% as the panel slides in).

### Buttons & Chips
*   **Primary Action:** `primary` (#3b82f6) background, `on-primary` (#002e6a) text. Border-radius: `md` (0.375rem).
*   **Revenue Chips:** Use `tertiary` (#4edea3) with 10% opacity for the background and 100% opacity for the text. No border.

### Data Visualizations
*   **Tooltips:** Must use `surface-container-highest` with no border. Text inside uses `label-md`.
*   **Lines:** Use `primary` for main trends. Use `tertiary` (Cyan #06b6d4) for subscription data. All lines should have a subtle glow (2px blur shadow) in their own color.

### Navigation Sidebar
*   **Grouping:** Use `label-sm` for category headers with 2.25rem (`spacing-10`) top margin to create "editorial" gaps.
*   **Active State:** No background pill. Instead, use a high-contrast `primary` text color and a small dot indicator.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use white space as a structural element. If you think you need a line, try adding `spacing-8` (1.75rem) of padding instead.
*   **Do** overlap elements. A KPI card can slightly overlap a chart container to create depth.
*   **Do** use `font-bold` sparingly for numbers only; keep labels and body text at `medium` or `regular` weight.

### Don’t
*   **Don’t** use pure black (#000000). Always use the `surface` or `surface-container-lowest` tokens.
*   **Don’t** use standard "drop shadows" with 20%+ opacity. They look "cheap" and break the dark-theme immersion.
*   **Don’t** use 100% opaque borders. They create "visual noise" that distracts from the commerce data.