# Command: audit-design

## Description

Audits all React/Next.js UI components against the industrial `Design.md` specification.

## Execution Checklist

1. Scan `frontend/src/components/` for non-standard Tailwind colors, hardcoded hex values, or generic drop shadows.
2. Verify all numbers in metric/stat tiles use `tabular-nums` and bold text (`--ink`).
3. Ensure status badges follow the **Dual-Intensity Tint Rule** (low-opacity tint background + full-saturation text/icons).
4. Verify floating map cards use `--shadow-overlay` and embedded dashboard tiles use `--shadow-card`.
5. Flag any usage of raw `div` `onClick` handlers that lack Radix/Shadcn accessible primitives or proper `:focus-visible` styling.
