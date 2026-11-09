"use client";

import { useState } from "react";
import type { SearchItem } from "@/app/api/search/route";
import { CATEGORIES, guessCategory } from "@/lib/categories";

interface Props {
  onPick: (item: SearchItem) => void;
  /** 검색창을 누를 때 (휴대폰 키보드가 올라올 때 아래 카드가 화면을 가리지 않도록 닫는 용도) */
  onFocus?: () => void;
  /** 지금 보고 있는 지도 가운데 좌표. 이 근처 가게를 먼저 찾는다. */
  getCenter?: () => [number, number] | null;
}

export default function SearchBar({ onPick, onFocus, getCenter }: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q });
      const center = getCenter?.();
      if (center) {
        params.set("lat", center[0].toFixed(6));
        params.set("lng", center[1].toFixed(6));
      }
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setItems(null);
        setError(
          data.error === "NO_KEY"
            ? "검색 API 키가 아직 없어요. 오른쪽 ＋ 버튼으로 지도를 탭해서 직접 추가할 수 있어요."
            : (data.message ?? "검색에 실패했어요."),
        );
      } else {
        setItems(data.items);
        if (data.items.length === 0) setError("검색 결과가 없어요. '전주 카페'처럼 지역명을 같이 써보세요.");
      }
    } catch {
      setError("검색에 실패했어요. 인터넷 연결을 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setItems(null);
    setError(null);
  }

  return (
    <div className="search">
      <form className="search__form" onSubmit={search}>
        <span className="search__icon">🔍</span>
        <input
          className="search__input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={onFocus}
          placeholder="가게 검색 (예: 전주 한옥마을 카페)"
          enterKeyHint="search"
        />
        {(items || error) && (
          <button type="button" className="search__clear" onClick={close} aria-label="닫기">
            ✕
          </button>
        )}
        <button className="search__submit" disabled={loading}>
          {loading ? "…" : "검색"}
        </button>
      </form>

      {error && <p className="search__error">{error}</p>}

      {items && items.length > 0 && (
        <ul className="search__results">
          {items.map((it, i) => {
            const cat = CATEGORIES[guessCategory(it.naverCategory)];
            return (
              <li key={`${it.name}-${i}`}>
                <button
                  onClick={() => {
                    onPick(it);
                    close();
                  }}
                >
                  <span className="search__emoji" style={{ background: cat.color }}>
                    {cat.emoji}
                  </span>
                  <span className="search__text">
                    <b>{it.name}</b>
                    <small>
                      {it.naverCategory} · {it.roadAddress || it.address}
                    </small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
