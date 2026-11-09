"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MapView, { type MapHandle } from "@/components/MapView";
import type { MarkerSpec } from "@/components/map/adapter";
import SearchBar from "@/components/SearchBar";
import FilterBar, { type Filter } from "@/components/FilterBar";
import { DraftSheet, PlaceSheet } from "@/components/PlaceSheet";
import RoutePanel from "@/components/RoutePanel";
import { guessCategory } from "@/lib/categories";
import { ME_ANCHOR, PIN_ANCHOR, PIN_SIZE, meHtml, pinHtml } from "@/lib/pin";
import { DEFAULT_CENTER } from "@/lib/sample";
import type { CategoryId, LatLng, PlaceDraft } from "@/lib/types";
import { useMyLocation } from "@/lib/useMyLocation";
import { usePlaces } from "@/lib/usePlaces";

type Draft = PlaceDraft & { category: CategoryId; manual: boolean };

export default function Home() {
  const store = usePlaces();
  const me = useMyLocation();
  const mapRef = useRef<MapHandle>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>({ categories: [], hideVisited: false });

  const selected = store.places.find((p) => p.id === selectedId) ?? null;

  // 처음 위치를 잡았을 때 저장된 핀이 없으면 내 위치로 이동
  const centeredOnMe = useRef(false);
  useEffect(() => {
    if (!me.pos || centeredOnMe.current || !store.loaded) return;
    centeredOnMe.current = true;
    if (store.places.length === 0) mapRef.current?.centerOn(me.pos, 16);
  }, [me.pos, store.loaded, store.places.length]);

  // 저장된 핀이 있으면 처음 한 번 전체가 보이게
  const fittedOnLoad = useRef(false);
  useEffect(() => {
    if (!store.loaded || fittedOnLoad.current) return;
    fittedOnLoad.current = true;
    if (store.places.length > 0) {
      setTimeout(() => mapRef.current?.fitTo(store.places.map((p) => [p.lat, p.lng])), 300);
    }
  }, [store.loaded, store.places]);

  const counts = useMemo(() => {
    const c: Record<CategoryId, number> = { cafe: 0, food: 0, shop: 0, attraction: 0, market: 0, parking: 0, spot: 0 };
    store.places.forEach((p) => c[p.category]++);
    return c;
  }, [store.places]);

  const routeStops = useMemo(
    () => store.route.map((id) => store.places.find((p) => p.id === id)).filter((p) => p !== undefined),
    [store.route, store.places],
  );

  const markers = useMemo<MarkerSpec[]>(() => {
    const visible = store.places.filter(
      (p) =>
        p.id === selectedId ||
        ((filter.categories.length === 0 || filter.categories.includes(p.category)) &&
          !(filter.hideVisited && p.status === "visited")),
    );
    const specs: MarkerSpec[] = visible.map((p) => {
      const order = store.route.indexOf(p.id) + 1 || undefined;
      const isSel = p.id === selectedId;
      return {
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        html: pinHtml({ category: p.category, status: p.status, name: p.name, order, selected: isSel }),
        size: PIN_SIZE,
        anchor: PIN_ANCHOR,
        zIndex: isSel ? 1000 : order ? 500 : p.status === "visited" ? 50 : 100,
        onClick: () => {
          setDraft(null);
          setRouteOpen(false);
          setSelectedId(p.id);
          mapRef.current?.focusOn([p.lat, p.lng]);
        },
      };
    });
    if (draft) {
      specs.push({
        id: "__draft",
        lat: draft.lat,
        lng: draft.lng,
        html: pinHtml({ category: draft.category, status: "want", name: draft.name || "새 핀", draft: true }),
        size: PIN_SIZE,
        anchor: PIN_ANCHOR,
        zIndex: 999,
      });
    }
    if (me.pos) {
      specs.push({ id: "__me", lat: me.pos[0], lng: me.pos[1], html: meHtml(), size: [24, 24], anchor: ME_ANCHOR, zIndex: 10 });
    }
    return specs;
  }, [store.places, store.route, selectedId, filter, draft, me.pos]);

  const routePath = useMemo<LatLng[]>(() => routeStops.map((p) => [p.lat, p.lng]), [routeStops]);

  function handleMapClick(pos: LatLng) {
    if (addMode) {
      setSelectedId(null);
      setRouteOpen(false);
      setDraft({ name: "", lat: pos[0], lng: pos[1], category: "spot", manual: true });
      setAddMode(false);
      mapRef.current?.focusOn(pos);
      return;
    }
    setSelectedId(null);
    setDraft(null);
  }

  function goToMe() {
    if (me.pos) mapRef.current?.centerOn(me.pos, 17);
    else alert(me.error ?? "위치를 찾는 중이에요. 잠시 후 다시 눌러주세요.");
  }

  const showEmpty = store.loaded && store.places.length === 0 && !draft;

  return (
    <main className="app">
      <MapView ref={mapRef} center={DEFAULT_CENTER} markers={markers} route={routePath} onMapClick={handleMapClick} />

      <header className="top">
        <SearchBar
          onPick={(it) => {
            setSelectedId(null);
            setRouteOpen(false);
            setDraft({ ...it, category: guessCategory(it.naverCategory), manual: false });
            mapRef.current?.focusOn([it.lat, it.lng], 17);
          }}
          getCenter={() => mapRef.current?.getCenter() ?? null}
          onFocus={() => {
            // 키보드가 올라오면 아래 카드가 화면을 가리므로 열려 있던 핀 정보는 닫는다.
            // 직접 꽂는 중인 핀(이름/메모 입력 중)은 날아가지 않도록 그대로 둔다.
            setSelectedId(null);
            setRouteOpen(false);
            setDraft((d) => (d && !d.manual ? null : d));
          }}
        />
        <FilterBar filter={filter} counts={counts} onChange={setFilter} />
      </header>

      {addMode && <div className="banner">📍 핀을 꽂을 위치를 지도에서 탭하세요</div>}

      <div className="fabs">
        <button
          className={`fab ${addMode ? "fab--on" : ""}`}
          onClick={() => setAddMode((v) => !v)}
          aria-label={addMode ? "핀 꽂기 취소" : "지도에 핀 꽂기"}
        >
          {addMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.5c-3.9 0-7 3-7 6.9 0 5 7 12.1 7 12.1s7-7.1 7-12.1c0-3.9-3.1-6.9-7-6.9z"
                fill="var(--accent)"
              />
              <circle cx="12" cy="9.4" r="2.6" fill="#fff" />
            </svg>
          )}
        </button>
        <button className="fab" onClick={goToMe} aria-label="내 위치">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.6" aria-hidden="true">
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="1.6" fill="#222" stroke="none" />
            <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <footer className="bottom">
        {draft ? (
          <DraftSheet
            key={`${draft.lat},${draft.lng}`}
            draft={draft}
            manual={draft.manual}
            onClose={() => setDraft(null)}
            onSave={(d, category, memo) => {
              const id = store.addPlace(d, category, memo);
              setDraft(null);
              setSelectedId(id);
            }}
          />
        ) : selected ? (
          <PlaceSheet
            place={selected}
            routeIndex={store.route.indexOf(selected.id)}
            onClose={() => setSelectedId(null)}
            onUpdate={(patch) => store.updatePlace(selected.id, patch)}
            onToggleVisited={() => store.toggleVisited(selected.id)}
            onToggleRoute={() =>
              store.route.includes(selected.id) ? store.removeFromRoute(selected.id) : store.addToRoute(selected.id)
            }
            onRemove={() => {
              store.removePlace(selected.id);
              setSelectedId(null);
            }}
          />
        ) : showEmpty ? (
          <section className="sheet empty">
            <p className="empty__pins">🍰 🍜 🧸 📸</p>
            <h2 className="sheet__title">아직 꽂은 핀이 없어요</h2>
            <p>위에서 가게를 검색하거나, ＋ 버튼을 누르고 지도를 탭해서 핀을 꽂아보세요.</p>
            <button className="btn btn--primary btn--block" onClick={() => {
                fittedOnLoad.current = false;
                store.loadSample();
              }}>
              샘플 핀 구경하기
            </button>
          </section>
        ) : (
          <RoutePanel
            stops={routeStops}
            open={routeOpen}
            onToggle={() => setRouteOpen((v) => !v)}
            onSelect={(id) => {
              const p = store.places.find((x) => x.id === id);
              setRouteOpen(false);
              setSelectedId(id);
              if (p) mapRef.current?.focusOn([p.lat, p.lng], 17);
            }}
            onMove={store.moveInRoute}
            onRemove={store.removeFromRoute}
            onClear={store.clearRoute}
            onFit={() => mapRef.current?.fitTo(routePath)}
          />
        )}
      </footer>
    </main>
  );
}
