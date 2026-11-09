"use client";

import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

export interface Filter {
  categories: CategoryId[]; // 비어 있으면 전체
  hideVisited: boolean;
}

interface Props {
  filter: Filter;
  counts: Record<CategoryId, number>;
  onChange: (f: Filter) => void;
}

export default function FilterBar({ filter, counts, onChange }: Props) {
  const all = filter.categories.length === 0;
  const toggle = (c: CategoryId) => {
    const has = filter.categories.includes(c);
    onChange({ ...filter, categories: has ? filter.categories.filter((x) => x !== c) : [...filter.categories, c] });
  };

  return (
    <div className="chips">
      <button className={`chip ${all ? "chip--on" : ""}`} onClick={() => onChange({ ...filter, categories: [] })}>
        전체
      </button>
      {CATEGORY_ORDER.map((c) => (
        <button
          key={c}
          className={`chip ${filter.categories.includes(c) ? "chip--on" : ""}`}
          style={{ "--chip-color": CATEGORIES[c].color } as React.CSSProperties}
          onClick={() => toggle(c)}
        >
          {CATEGORIES[c].emoji} {CATEGORIES[c].label} <small>{counts[c]}</small>
        </button>
      ))}
      <button
        className={`chip ${filter.hideVisited ? "chip--on" : ""}`}
        onClick={() => onChange({ ...filter, hideVisited: !filter.hideVisited })}
      >
        안 가본 곳만
      </button>
    </div>
  );
}
