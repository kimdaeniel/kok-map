"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import CategoryIcon from "./CategoryIcon";
import { naverAppPlaceUrl, naverAppWalkUrl, naverWebPlaceUrl, openNaver } from "@/lib/naver-links";
import type { CategoryId, Place, PlaceDraft } from "@/lib/types";

function CategoryPicker({ value, onChange }: { value: CategoryId; onChange: (c: CategoryId) => void }) {
  return (
    <div className="cat-picker">
      {CATEGORY_ORDER.map((c) => (
        <button
          key={c}
          className={`cat-picker__item ${value === c ? "cat-picker__item--on" : ""}`}
          style={{ "--chip-color": CATEGORIES[c].color } as React.CSSProperties}
          onClick={() => onChange(c)}
        >
          <CategoryIcon category={c} size={24} />
          {CATEGORIES[c].label}
        </button>
      ))}
    </div>
  );
}

function Info({ p }: { p: Pick<Place, "roadAddress" | "address" | "telephone" | "naverCategory"> }) {
  return (
    <dl className="sheet__info">
      {p.naverCategory && (
        <>
          <dt>분류</dt>
          <dd>{p.naverCategory}</dd>
        </>
      )}
      {(p.roadAddress || p.address) && (
        <>
          <dt>주소</dt>
          <dd>{p.roadAddress || p.address}</dd>
        </>
      )}
      {p.telephone && (
        <>
          <dt>전화</dt>
          <dd>
            <a href={`tel:${p.telephone}`}>{p.telephone}</a>
          </dd>
        </>
      )}
    </dl>
  );
}

/* ---------- 새로 저장할 장소 ---------- */

interface DraftProps {
  draft: PlaceDraft & { category: CategoryId };
  manual: boolean;
  onSave: (draft: PlaceDraft, category: CategoryId, memo: string) => void;
  onClose: () => void;
}

export function DraftSheet({ draft, manual, onSave, onClose }: DraftProps) {
  const [name, setName] = useState(draft.name);
  const [category, setCategory] = useState(draft.category);
  const [memo, setMemo] = useState("");

  return (
    <section className="sheet">
      <div className="sheet__actions">
        <button className="sheet__icon-btn" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>
      <p className="sheet__kicker">새 핀 저장하기</p>
      {manual ? (
        <input
          className="sheet__name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="가게 이름"
          autoFocus
        />
      ) : (
        <h2 className="sheet__title">{draft.name}</h2>
      )}
      <Info p={draft} />
      <p className="sheet__label">어떤 곳인가요?</p>
      <CategoryPicker value={category} onChange={setCategory} />
      <textarea
        className="sheet__memo"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모 (예: 딸기케이크 꼭 먹기)"
        rows={1}
      />
      <button
        className="btn btn--primary btn--block"
        disabled={!name.trim()}
        onClick={() => onSave({ ...draft, name: name.trim() }, category, memo)}
      >
        📍 핀 꽂기
      </button>
    </section>
  );
}

/* ---------- 저장된 장소 ---------- */

interface PlaceProps {
  place: Place;
  routeIndex: number; // -1이면 루트에 없음
  onUpdate: (patch: Partial<Place>) => void;
  onToggleVisited: () => void;
  onToggleRoute: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export function PlaceSheet({ place, routeIndex, onUpdate, onToggleVisited, onToggleRoute, onRemove, onClose }: PlaceProps) {
  const cat = CATEGORIES[place.category];
  const visited = place.status === "visited";
  const [editingCat, setEditingCat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className={`sheet ${visited ? "sheet--visited" : ""}`}>
      <div className="sheet__actions">
        <button className="sheet__icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="핀 설정">
          ⋯
        </button>
        <button className="sheet__icon-btn" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        {menuOpen && (
          <div className="sheet__menu" role="menu">
            <button
              role="menuitem"
              onClick={() => {
                setEditingCat(true);
                setMenuOpen(false);
              }}
            >
              카테고리 바꾸기
            </button>
            <button
              role="menuitem"
              className="sheet__menu--danger"
              onClick={() => {
                setMenuOpen(false);
                if (confirm(`'${place.name}' 핀을 삭제할까요?`)) onRemove();
              }}
            >
              핀 삭제
            </button>
          </div>
        )}
      </div>

      {/* 아이콘이 종류를 알려주므로 "카페/명소" 같은 글자 없이 아이콘 + 이름 한 줄 */}
      <div className="sheet__head">
        <span className="sheet__badge" style={{ background: cat.color }} title={cat.label}>
          <CategoryIcon category={place.category} size={22} />
        </span>
        <h2 className="sheet__title">{place.name}</h2>
      </div>
      {(visited || routeIndex >= 0) && (
        <div className="sheet__tags">
          {visited && <span className="sheet__visited">✓ 다녀옴</span>}
          {routeIndex >= 0 && <span className="sheet__route">오늘 루트 {routeIndex + 1}번</span>}
        </div>
      )}
      {editingCat && (
        <CategoryPicker
          value={place.category}
          onChange={(c) => {
            onUpdate({ category: c });
            setEditingCat(false);
          }}
        />
      )}
      <Info p={place} />
      <textarea
        className="sheet__memo"
        defaultValue={place.memo}
        key={place.id}
        onBlur={(e) => e.target.value !== place.memo && onUpdate({ memo: e.target.value })}
        placeholder="메모를 남겨보세요"
        rows={1}
      />

      <div className="sheet__row">
        <button className={`btn ${visited ? "" : "btn--primary"}`} onClick={onToggleVisited}>
          {visited ? "↩︎ 아직 안 갔어요" : "✅ 다녀왔어요"}
        </button>
        <button className="btn" onClick={onToggleRoute}>
          {routeIndex >= 0 ? "➖ 루트에서 빼기" : "➕ 오늘 루트에 추가"}
        </button>
      </div>
      <div className="sheet__row">
        <button className="btn btn--naver" onClick={() => openNaver(naverAppPlaceUrl(place), naverWebPlaceUrl(place))}>
          <b>N</b> 네이버 지도
        </button>
        <button className="btn btn--naver" onClick={() => openNaver(naverAppWalkUrl(place), naverWebPlaceUrl(place))}>
          🚶 길찾기
        </button>
      </div>
    </section>
  );
}
