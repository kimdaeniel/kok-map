"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CategoryId, Place, PlaceDraft, Trip, TripView } from "./types";
import { SAMPLE_PLACES } from "./sample";
import type { SharedTrip } from "./share";

const STORAGE_KEY = "kok-map:v2";
/** 여행 기능 이전 저장 형식. 처음 열 때 한 번 "내 여행"으로 옮긴다 */
const LEGACY_KEY = "kok-map:v1";

interface StoredData {
  version: 2;
  trips: Trip[];
  current: TripView;
  places: Place[];
  /** 여행별 루트: 여행 id → 장소 id 목록(방문 순서) */
  routes: Record<string, string[]>;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newTrip(name: string, startDate?: string, endDate?: string): Trip {
  return { id: newId(), name, startDate: startDate || undefined, endDate: endDate || undefined, createdAt: Date.now() };
}

function emptyData(): StoredData {
  const t = newTrip("내 여행");
  return { version: 2, trips: [t], current: "none", places: [], routes: { [t.id]: [] } };
}

/** placeId 핀이 속한 여행의 루트를 fn으로 바꾼다 */
function editRouteOf(d: StoredData, placeId: string, fn: (r: string[]) => string[]): StoredData {
  const tripId = d.places.find((p) => p.id === placeId)?.tripId;
  if (!tripId) return d;
  return { ...d, routes: { ...d.routes, [tripId]: fn(d.routes[tripId] ?? []) } };
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as StoredData;
      // 앱을 열 때는 항상 아무 여행도 안 고른 빈 지도에서 시작
      if (d.version === 2 && Array.isArray(d.trips) && d.trips.length > 0 && Array.isArray(d.places))
        return { ...d, current: "none" };
    }
    // 예전 형식(여행 없음) → 기존 핀과 루트를 "내 여행"으로 옮긴다
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { places?: Omit<Place, "tripId">[]; route?: string[] };
      const t = newTrip("내 여행");
      return {
        version: 2,
        trips: [t],
        current: "none",
        places: (old.places ?? []).map((p) => ({ ...p, tripId: t.id })),
        routes: { [t.id]: old.route ?? [] },
      };
    }
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 빈 상태로 시작
  }
  return emptyData();
}

export function usePlaces() {
  const [data, setData] = useState<StoredData>(emptyData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 무시
    }
  }, [data, loaded]);

  const isAll = data.current === "all";
  const isNone = !isAll && !data.trips.some((t) => t.id === data.current);
  const currentTrip = isAll || isNone ? null : data.trips.find((t) => t.id === data.current)!;

  /** 지금 지도에 보일 핀 (지금 여행, 전체 보기면 모두, 안 골랐으면 없음) */
  const places = useMemo(
    () => (currentTrip ? data.places.filter((p) => p.tripId === currentTrip.id) : isAll ? data.places : []),
    [data.places, currentTrip, isAll],
  );
  /** 지금 여행의 루트 (전체 보기에서는 비어 있음) */
  const route = useMemo(() => (currentTrip ? (data.routes[currentTrip.id] ?? []) : []), [data.routes, currentTrip]);

  const tripCounts = useMemo(() => {
    const c: Record<string, number> = {};
    data.places.forEach((p) => (c[p.tripId] = (c[p.tripId] ?? 0) + 1));
    return c;
  }, [data.places]);

  /* ---------- 여행 ---------- */

  const selectTrip = useCallback((view: TripView) => setData((d) => ({ ...d, current: view })), []);

  const createTrip = useCallback((name: string, startDate?: string, endDate?: string) => {
    const t = newTrip(name, startDate, endDate);
    setData((d) => ({ ...d, trips: [...d.trips, t], current: t.id, routes: { ...d.routes, [t.id]: [] } }));
    return t.id;
  }, []);

  const updateTrip = useCallback((id: string, patch: Partial<Omit<Trip, "id" | "createdAt">>) => {
    setData((d) => ({ ...d, trips: d.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);

  /** 여행과 그 여행의 핀을 모두 지운다. 마지막 여행이면 빈 "내 여행"을 새로 만든다 */
  const deleteTrip = useCallback((id: string) => {
    setData((d) => {
      const trips = d.trips.filter((t) => t.id !== id);
      const places = d.places.filter((p) => p.tripId !== id);
      const routes = { ...d.routes };
      delete routes[id];
      if (trips.length === 0) {
        const t = newTrip("내 여행");
        return { ...d, trips: [t], current: "none", places, routes: { ...routes, [t.id]: [] } };
      }
      const current = d.current === id ? "none" : d.current;
      return { ...d, trips, current, places, routes };
    });
  }, []);

  /** 공유 링크로 받은 여행을 내 여행으로 추가하고 그 여행으로 바꾼다 */
  const importTrip = useCallback((shared: SharedTrip): string => {
    const t = newTrip(shared.name, shared.startDate, shared.endDate);
    const now = Date.now();
    const places: Place[] = shared.places.map((p) => ({ ...p, id: newId(), tripId: t.id, status: "want", createdAt: now }));
    const route = shared.route.map((i) => places[i]?.id).filter((id): id is string => !!id);
    setData((d) => ({
      ...d,
      trips: [...d.trips, t],
      current: t.id,
      places: [...d.places, ...places],
      routes: { ...d.routes, [t.id]: [...new Set(route)] },
    }));
    return t.id;
  }, []);

  /** 공유할 때 쓰는 그 여행의 핀과 루트 */
  const tripData = useCallback(
    (tripId: string) => ({
      places: data.places.filter((p) => p.tripId === tripId),
      route: data.routes[tripId] ?? [],
    }),
    [data.places, data.routes],
  );

  /* ---------- 핀 ---------- */

  /** tripId를 안 주면 지금 여행에 저장 (전체 보기·안 고름이면 첫 번째 여행) */
  const addPlace = useCallback(
    (draft: PlaceDraft, category: CategoryId, memo = "", tripId?: string): string => {
      const id = newId();
      setData((d) => {
        const target = tripId ?? (d.trips.some((t) => t.id === d.current) ? d.current : d.trips[0].id);
        const place: Place = { ...draft, id, tripId: target, category, memo, status: "want", createdAt: Date.now() };
        return { ...d, places: [...d.places, place] };
      });
      return id;
    },
    [],
  );

  /** 같은 가게를 다른 여행에도 넣는다 (새 핀, 다녀옴은 초기화, 메모는 복사) */
  const copyPlaceToTrip = useCallback((id: string, tripId: string) => {
    setData((d) => {
      const src = d.places.find((p) => p.id === id);
      if (!src) return d;
      const copy: Place = { ...src, id: newId(), tripId, status: "want", visitedAt: undefined, createdAt: Date.now() };
      return { ...d, places: [...d.places, copy] };
    });
  }, []);

  const updatePlace = useCallback((id: string, patch: Partial<Place>) => {
    setData((d) => ({ ...d, places: d.places.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }, []);

  const removePlace = useCallback((id: string) => {
    setData((d) => {
      const routes: Record<string, string[]> = {};
      for (const [k, r] of Object.entries(d.routes)) routes[k] = r.filter((x) => x !== id);
      return { ...d, places: d.places.filter((p) => p.id !== id), routes };
    });
  }, []);

  const toggleVisited = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      places: d.places.map((p) =>
        p.id === id
          ? p.status === "visited"
            ? { ...p, status: "want", visitedAt: undefined }
            : { ...p, status: "visited", visitedAt: Date.now() }
          : p,
      ),
    }));
  }, []);

  /* ---------- 루트 (핀이 속한 여행의 루트를 바꾼다) ---------- */

  const routeOf = useCallback(
    (placeId: string): string[] => {
      const tripId = data.places.find((p) => p.id === placeId)?.tripId;
      return tripId ? (data.routes[tripId] ?? []) : [];
    },
    [data.places, data.routes],
  );

  const addToRoute = useCallback((id: string) => {
    setData((d) => editRouteOf(d, id, (r) => (r.includes(id) ? r : [...r, id])));
  }, []);

  const removeFromRoute = useCallback((id: string) => {
    setData((d) => editRouteOf(d, id, (r) => r.filter((x) => x !== id)));
  }, []);

  const moveInRoute = useCallback((id: string, delta: -1 | 1) => {
    setData((d) =>
      editRouteOf(d, id, (r) => {
        const i = r.indexOf(id);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= r.length) return r;
        const next = [...r];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      }),
    );
  }, []);

  const clearRoute = useCallback(() => {
    setData((d) => (d.trips.some((t) => t.id === d.current) ? { ...d, routes: { ...d.routes, [d.current]: [] } } : d));
  }, []);

  const loadSample = useCallback(() => {
    setData((d) => {
      const tripId = d.trips.some((t) => t.id === d.current) ? d.current : d.trips[0].id;
      return {
        ...d,
        places: [
          ...d.places,
          ...SAMPLE_PLACES.map(({ memo, category, ...draft }) => ({
            ...draft,
            id: newId(),
            tripId,
            category,
            memo,
            status: "want" as const,
            createdAt: Date.now(),
          })),
        ],
      };
    });
  }, []);

  return {
    loaded,
    trips: data.trips,
    currentTrip,
    isAll,
    isNone,
    tripCounts,
    selectTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    importTrip,
    tripData,
    places,
    route,
    routeOf,
    addPlace,
    copyPlaceToTrip,
    updatePlace,
    removePlace,
    toggleVisited,
    addToRoute,
    removeFromRoute,
    moveInRoute,
    clearRoute,
    loadSample,
  };
}
