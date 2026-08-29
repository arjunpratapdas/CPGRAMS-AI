## Design Review Rules (Apple HIG)

When building, reviewing, or refactoring UI components, strictly follow the guidelines defined in:
- `.design-rules/SKILL.md` — Main review & audit methodology
- `.design-rules/references/hig-lookup.md` — Topic-to-file lookup table
- `.design-rules/references/hig/` — HIG guideline documents (typography, color, layout, accessibility, motion)

### Project-Specific Constraints (Rural & Web Override)
While applying HIG design principles:
1. **Touch Targets:** Minimum 48px to 60px height for all interactive elements (buttons, inputs).
2. **Reduced Motion:** Always wrap GSAP/CSS animations with `window.matchMedia('(prefers-reduced-motion: reduce)')` checks.
3. **Contrast & Outdoor Readability:** Maintain high contrast ratios (`#0f172a` slate backgrounds with high-contrast text and bright accent indicators).
4. **Performance:** Do not animate layout properties (`width`, `height`, `margin`). Animate only `opacity` and `transform`.