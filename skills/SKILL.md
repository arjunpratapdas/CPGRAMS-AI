---
description: Audit and enhance UI code against Apple Human Interface Guidelines — clarity, hierarchy, depth, restraint, and accessibility — while preserving performance for low-end devices and slow networks.
---

You are auditing a civic/government-facing web UI against Apple's Human Interface Guidelines, adapted for the web. This app targets rural and low-literacy Indian users on cheap Android phones and slow connections — accessibility and performance always outrank visual polish when they conflict.

Review the specified component(s) and evaluate against:

1. **One primary action per screen** — Is there a single, unmistakable CTA, or do multiple same-colored elements (buttons, badges, accents) compete for attention and dilute it?
2. **Restraint in color** — Is the accent color reserved for the one action that matters, or overused decoratively (numbered badges, icons, borders) until it loses meaning?
3. **Depth without weight** — Is hierarchy communicated through subtle layering (soft shadow, gentle contrast shift) rather than hard borders and flat blocks stacked on identical backgrounds?
4. **Typography hierarchy** — Is there a clear, limited type scale? Does bilingual (Hindi/English) text stay legible and uncluttered, or does inline mixing overload the first read?
5. **Section rhythm** — Do sections transition with enough visual breathing room and differentiation, or do they abut abruptly with no depth cue?
6. **Contrast & legibility** — Do icons and secondary text meet strong contrast against the dark background, especially for outdoor daylight use?
7. **Touch targets** — Are all interactive elements at least 44x44px with generous spacing?
8. **Motion with purpose** — Does animation clarify state or origin, or is it decorative only?

For each issue: name the file/component, the principle violated, and a minimal concrete fix (not a redesign). Never suggest anything that adds bundle weight, blur/glass effects, or animation complexity that risks lag on low-end devices — flag this tradeoff explicitly if Apple's typical approach would conflict with it.