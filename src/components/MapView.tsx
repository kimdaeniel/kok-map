"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { MapAdapter, MarkerSpec } from "./map/adapter";
import { createNaverMap } from "./map/naverAdapter";
import { createLeafletMap } from "./map/leafletAdapter";
import type { LatLng } from "@/lib/types";

export interface MapHandle {
  centerOn(pos: LatLng, zoom?: number): void;
  /** 하단 카드 위쪽에 보이도록 이동 */
  focusOn(pos: LatLng, zoom?: number): void;
  fitTo(points: LatLng[]): void;
  getCenter(): LatLng | null;
}

interface Props {
  ref?: Ref<MapHandle>;
  center: LatLng;
  markers: MarkerSpec[];
  route: LatLng[];
  onMapClick: (pos: LatLng) => void;
}

const NAVER_KEY = process.env.NEXT_PUBLIC_NAVER_MAP_KEY_ID ?? "";
/** 이 줌보다 멀리 보면 핀 이름표를 숨긴다 */
const LABEL_MIN_ZOOM = 15;

export default function MapView({ ref, center, markers, route, onMapClick }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MapAdapter | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(16);
  const [notice, setNotice] = useState<string | null>(null);

  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;
  const initialCenter = useRef(center);

  useEffect(() => {
    let cancelled = false;
    let adapter: MapAdapter | null = null;
    const el = elRef.current!;
    const opts = {
      center: initialCenter.current,
      zoom: 16,
      onClick: (p: LatLng) => clickRef.current(p),
      onZoom: (z: number) => setZoom(z),
    };

    const fallbackToOsm = async (msg: string | null) => {
      el.innerHTML = "";
      adapter?.destroy();
      adapter = await createLeafletMap(el, opts);
      if (cancelled) return adapter.destroy();
      adapterRef.current = adapter;
      setNotice(msg);
      setReady(true);
    };

    (async () => {
      if (!NAVER_KEY) return fallbackToOsm("네이버 지도 키가 없어서 임시 지도(OpenStreetMap)를 보여주고 있어요.");
      try {
        adapter = await createNaverMap(el, NAVER_KEY, opts, () => {
          if (!cancelled) void fallbackToOsm("네이버 지도 키 인증에 실패했어요. 키와 등록한 서비스 URL을 확인해 주세요.");
        });
        if (cancelled) return adapter.destroy();
        adapterRef.current = adapter;
        setReady(true);
      } catch {
        if (!cancelled) await fallbackToOsm("네이버 지도를 불러오지 못해서 임시 지도를 보여주고 있어요.");
      }
    })();

    return () => {
      cancelled = true;
      adapter?.destroy();
      adapterRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ready) adapterRef.current?.setMarkers(markers);
  }, [ready, markers]);

  useEffect(() => {
    if (ready) adapterRef.current?.setRoute(route);
  }, [ready, route]);

  useImperativeHandle(
    ref,
    () => ({
      centerOn: (pos, z) => adapterRef.current?.setCenter(pos, z),
      focusOn: (pos, z) => adapterRef.current?.setCenter(pos, z, Math.round(window.innerHeight * 0.22)),
      fitTo: (points) => adapterRef.current?.fitTo(points),
      getCenter: () => adapterRef.current?.getCenter() ?? null,
    }),
    [],
  );

  return (
    <>
      <div ref={elRef} className={`map ${zoom < LABEL_MIN_ZOOM ? "map--far" : ""}`} />
      {notice && (
        <button className="map-notice" onClick={() => setNotice(null)}>
          {notice} <b>✕</b>
        </button>
      )}
    </>
  );
}
