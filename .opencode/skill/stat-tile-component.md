---

#### `.opencode/skill/stat-tile-component.md`

````markdown
# Skill: stat-tile-component

## Context

Generates industrial-grade metric tiles conforming to the **Apple / Linear / Dispatch** visual standard in `Design.md`.

## Implementation Standard (TypeScript - Next.js 16)

```tsx
"use client";

import React from "react";

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  statusToken?: "completed" | "active" | "warning";
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  unit,
  trend,
  statusToken = "active",
}) => {
  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-[--surface] border border-[--border-muted] shadow-[--shadow-card] transition-all hover:border-[--border-subtle]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
            {trend}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-bold tracking-tight text-[--ink] tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-gray-500">{unit}</span>
        )}
      </div>
    </div>
  );
};
```
````
