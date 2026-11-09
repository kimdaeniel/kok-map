"use client";

import { CATEGORIES } from "@/lib/categories";
import { estimateWalkMinutes, formatDistance, pathDistance } from "@/lib/geo";
import { naverAppWalkUrl, naverWebPlaceUrl, openNaver } from "@/lib/naver-links";
import type { Place } from "@/lib/types";

interface Props {
  stops: Place[];
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onFit: () => void;
}

export default function RoutePanel({ stops, open, onToggle, onSelect, onMove, onRemove, onClear, onFit }: Props) {
  const dist = pathDistance(stops.map((p) => [p.lat, p.lng]));
  const done = stops.filter((p) => p.status === "visited").length;
  const next = stops.find((p) => p.status !== "visited");

  if (!open) {
    return (
      <button className="route-chip" onClick={onToggle}>
        🗺️ 오늘 루트 <b>{stops.length}곳</b>
        {stops.length > 1 && <span> · {formatDistance(dist)}</span>}
        {stops.length > 0 && (
          <span>
            {" "}
            · {done}/{stops.length} 완료
          </span>
        )}
      </button>
    );
  }

  return (
    <section className="sheet route">
      <button className="sheet__close" onClick={onToggle} aria-label="닫기">
        ✕
      </button>
      <h2 className="sheet__title">🗺️ 오늘 루트</h2>
      {stops.length === 0 ? (
        <p className="route__empty">
          핀을 누르고 <b>➕ 오늘 루트에 추가</b>를 눌러 순서대로 담아보세요.
        </p>
      ) : (
        <>
          <p className="route__summary">
            {stops.length}곳 · 직선 {formatDistance(dist)} · 걸어서 약 {estimateWalkMinutes(dist)}분 · {done}곳 완료
          </p>
          <ol className="route__list">
            {stops.map((p, i) => (
              <li key={p.id} className={p.status === "visited" ? "route__item--done" : ""}>
                <span className="route__num">{i + 1}</span>
                <button className="route__name" onClick={() => onSelect(p.id)}>
                  {CATEGORIES[p.category].emoji} {p.name}
                </button>
                <button onClick={() => onMove(p.id, -1)} disabled={i === 0} aria-label="위로">
                  ▲
                </button>
                <button onClick={() => onMove(p.id, 1)} disabled={i === stops.length - 1} aria-label="아래로">
                  ▼
                </button>
                <button onClick={() => onRemove(p.id)} aria-label="빼기">
                  ✕
                </button>
              </li>
            ))}
          </ol>
          {next && (
            <button
              className="btn btn--primary btn--block"
              onClick={() => openNaver(naverAppWalkUrl(next), naverWebPlaceUrl(next))}
            >
              🚶 다음 장소 길찾기: {next.name}
            </button>
          )}
          <div className="sheet__row">
            <button className="btn" onClick={onFit}>
              루트 전체 보기
            </button>
            <button className="btn btn--ghost" onClick={() => confirm("루트를 비울까요? (핀은 남아요)") && onClear()}>
              루트 비우기
            </button>
          </div>
        </>
      )}
    </section>
  );
}
