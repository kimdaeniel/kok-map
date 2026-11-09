"use client";

import { useEffect, useState } from "react";
import type { LatLng } from "./types";

export interface MyLocation {
  pos: LatLng | null;
  accuracy: number | null;
  error: string | null;
}

/** 실시간 내 위치를 계속 따라간다 (watchPosition). */
export function useMyLocation(): MyLocation {
  const [state, setState] = useState<MyLocation>({ pos: null, accuracy: null, error: null });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, error: "이 브라우저는 위치 기능을 지원하지 않아요." }));
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => setState({ pos: [p.coords.latitude, p.coords.longitude], accuracy: p.coords.accuracy, error: null }),
      (e) =>
        setState((s) => ({
          ...s,
          error: e.code === e.PERMISSION_DENIED ? "위치 권한이 꺼져 있어요." : "위치를 가져오지 못했어요.",
        })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return state;
}
