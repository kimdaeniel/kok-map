"use client";

import { useCallback, useEffect, useState } from "react";
import type { CategoryId, Place, PlaceDraft } from "./types";
import { SAMPLE_PLACES } from "./sample";

const STORAGE_KEY = "kok-map:v1";

interface StoredData {
  places: Place[];
  /** 오늘 루트: 장소 id를 방문 순서대로 */
  route: string[];
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as StoredData;
      if (Array.isArray(data.places) && Array.isArray(data.route)) return data;
    }
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 빈 상태로 시작
  }
  return { places: [], route: [] };
}

export function usePlaces() {
  const [data, setData] = useState<StoredData>({ places: [], route: [] });
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

  const addPlace = useCallback((draft: PlaceDraft, category: CategoryId, memo = ""): string => {
    const id = newId();
    const place: Place = { ...draft, id, category, memo, status: "want", createdAt: Date.now() };
    setData((d) => ({ ...d, places: [...d.places, place] }));
    return id;
  }, []);

  const updatePlace = useCallback((id: string, patch: Partial<Place>) => {
    setData((d) => ({ ...d, places: d.places.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }, []);

  const removePlace = useCallback((id: string) => {
    setData((d) => ({ places: d.places.filter((p) => p.id !== id), route: d.route.filter((r) => r !== id) }));
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

  const addToRoute = useCallback((id: string) => {
    setData((d) => (d.route.includes(id) ? d : { ...d, route: [...d.route, id] }));
  }, []);

  const removeFromRoute = useCallback((id: string) => {
    setData((d) => ({ ...d, route: d.route.filter((r) => r !== id) }));
  }, []);

  const moveInRoute = useCallback((id: string, delta: -1 | 1) => {
    setData((d) => {
      const i = d.route.indexOf(id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= d.route.length) return d;
      const route = [...d.route];
      [route[i], route[j]] = [route[j], route[i]];
      return { ...d, route };
    });
  }, []);

  const clearRoute = useCallback(() => setData((d) => ({ ...d, route: [] })), []);

  const loadSample = useCallback(() => {
    setData((d) => ({
      ...d,
      places: [
        ...d.places,
        ...SAMPLE_PLACES.map(({ memo, category, ...draft }) => ({
          ...draft,
          id: newId(),
          category,
          memo,
          status: "want" as const,
          createdAt: Date.now(),
        })),
      ],
    }));
  }, []);

  return {
    places: data.places,
    route: data.route,
    loaded,
    addPlace,
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
