# Design System Strategy: The Editorial Boutique

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Atelier"**

This design system moves beyond the transactional nature of e-commerce to embrace the soul of a high-end fashion editorial. We are not building a "storefront"; we are curating a digital gallery. The aesthetic sits in the tension between the structured precision of COS and the trend-forward energy of Zara.

To break the "template" look, this system utilizes **intentional asymmetry**. Layouts should feel like a physical magazine spread where elements bleed off the grid, and "Negative Space" is treated as a premium material rather than empty air. By combining a warm, tactile palette with sharp, brutalist edges (0px rounding), we create an atmosphere of "Approachable Luxury."

---

## 2. Colors & Tonal Depth
Our palette is anchored in heritage tones: a warm, paper-like background and a deep, ink-black for high-contrast legibility.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited.** To define sections, use background color shifts. A product gallery sitting on `surface` (#fcf9f8) might transition into a "Recommended" section using `surface-container-low` (#f6f3f2). Boundaries must be felt through tone, not seen through lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked fine papers. 
- **Base Layer:** `surface` (#fcf9f8).
- **Secondary Content Blocks:** `surface-container` (#f0edec).
- **Elevated Interactive Elements:** `surface-container-highest` (#e5e2e1).

### The "Glass & Soul" Rule
To add professional polish, utilize **Glassmorphism** for floating navigation or quick-cart overlays. Use `surface_container_lowest` (#ffffff) at 70% opacity with a `20px` backdrop-blur. 
*Signature Polish:* Apply a subtle CSS grain texture (3% opacity) over the `background` to eliminate the clinical feel of digital hex codes.

---

## 3. Typography
The typographic pairing reflects the brand's duality: the romanticism of the runway and the modernism of the street.

*   **Display & Headlines (Playfair Display / Noto Serif):** Use for storytelling and high-impact editorial moments. `display-lg` (3.5rem) should be used with tight letter-spacing (-0.02em) to feel authoritative.
*   **Body & Labels (Outfit / Plus Jakarta Sans):** These sans-serifs provide a technical, clean counter-balance. Use `body-md` (0.875rem) for product descriptions to maintain a "minimalist" density.
*   **The Narrative Scale:** Always lead with a serif headline. Use the `secondary` (#705d00) color for `label-sm` elements to highlight "New Arrivals" or "Limited Edition" status without breaking the high-contrast rhythm.

---

## 4. Elevation & Depth
In this system, "Up" does not mean "Shadow." It means "Contrast."

*   **Tonal Layering:** Instead of a drop shadow, place a `surface-container-lowest` (#ffffff) card against a `surface-dim` (#dcd9d8) background. This creates a "soft lift" that feels architectural.
*   **Ambient Shadows:** If a floating element (like a modal) requires a shadow, use a "Ghost Shadow": `0px 24px 48px rgba(28, 28, 27, 0.06)`. It should be barely perceptible—a whisper of light blockage, not a heavy blotch.
*   **The Ghost Border Fallback:** If a container must be defined on a matching background, use the `outline-variant` (#c4c7c7) at 15% opacity. 

---

## 5. Components & UI Elements

### Buttons
*   **Primary:** `primary` (#161717) background with `on-primary` (#ffffff) text. Shape: 0px radius (Sharp).
*   **CTA / Highlight:** `secondary_container` (#ffde59) with `on-secondary_container` (#756100) text. Use for "Add to Cart" to draw the eye instantly.
*   **Ghost:** Transparent background with a `1px` `outline` (#747878) border.

### Input Fields (Floating Labels)
To maintain the minimalist aesthetic, use **Floating Labels**. The label should sit within the input at `body-md` and transition to `label-sm` (uppercase, +0.1em tracking) above the input upon focus. Use `surface_container_low` for the input track.

### Cards & Product Grids
**Forbid the use of dividers.** Separate products using the Spacing Scale (Token `8` or `10`). 
*   **Asymmetric Variation:** In a grid of 4 products, make the 3rd item span 2 columns with a serif caption to break the "template" feel.

### Selection Chips
Small, sharp-edged boxes. Unselected: `surface-container-high`. Selected: `primary`. Never use rounded "pill" shapes.

### Custom Component: The "Quick-Look" Drawer
Instead of a standard modal, use a side-aligned drawer that slides in from the right. Use a `surface_container_lowest` (#ffffff) background with a high-blur backdrop to keep the user grounded in the shop context.

---

## 6. Do's and Don'ts

### Do
*   **DO** use the `20` (7rem) spacing token between major sections to let the brand "breathe."
*   **DO** align text to the left but allow images to be staggered or offset from the main container.
*   **DO** use Lucide React icons with a `1px` stroke-weight to match the refinement of the typography.

### Don't
*   **DON'T** use 0.5px or 1px solid black borders to separate content.
*   **DON'T** use any border-radius/rounded corners. Everything must be 0px for a high-fashion, architectural look.
*   **DON'T** use pure #000000 for text. Use `primary` (#161717) to maintain the "warm" luxury feel.
*   **DON'T** use "Standard" easing. All transitions should be `cubic-bezier(0.22, 1, 0.36, 1)` for a "heavy" and elegant feel.