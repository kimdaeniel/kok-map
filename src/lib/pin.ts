import { CATEGORIES } from "./categories";
import type { CategoryId, PlaceStatus } from "./types";

export const PIN_SIZE: [number, number] = [44, 60];
/** 바늘 끝이 실제 좌표에 오도록 하는 기준점 */
export const PIN_ANCHOR: [number, number] = [22, 58];
export const ME_ANCHOR: [number, number] = [12, 12];

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

export interface PinOptions {
  category: CategoryId;
  status: PlaceStatus;
  name: string;
  /** 오늘 루트에서의 순서 (1부터) */
  order?: number;
  selected?: boolean;
  draft?: boolean;
}

/** 동그란 머리 + 바늘 모양 핀의 HTML */
export function pinHtml({ category, status, name, order, selected, draft }: PinOptions): string {
  const cat = CATEGORIES[category];
  const cls = [
    "pin",
    `pin--${status}`,
    selected ? "pin--selected" : "",
    draft ? "pin--draft" : "",
    order ? "pin--route" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const badge = order
    ? `<span class="pin__badge">${order}</span>`
    : status === "visited"
      ? `<span class="pin__check">✓</span>`
      : "";
  return `<div class="${cls}" style="--pin-color:${cat.color}">
  <div class="pin__needle"></div>
  <div class="pin__head"><span class="pin__emoji">${cat.emoji}</span></div>
  ${badge}
  <div class="pin__label">${escapeHtml(name)}</div>
</div>`;
}

export function meHtml(): string {
  return `<div class="me-dot"><span class="me-dot__pulse"></span><span class="me-dot__core"></span></div>`;
}
