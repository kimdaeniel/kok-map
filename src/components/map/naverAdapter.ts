/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LatLng } from "@/lib/types";
import { ROUTE_COLOR, type CreateMapOptions, type MapAdapter, type MarkerSpec } from "./adapter";

declare global {
  interface Window {
    naver?: any;
    navermap_authFailure?: () => void;
  }
}

let loading: Promise<void> | null = null;

/** 네이버 지도 JS v3 스크립트를 한 번만 불러온다. */
function loadNaverMaps(keyId: string, onAuthFailure: () => void): Promise<void> {
  // 키 인증이 실패하면 네이버 스크립트가 이 전역 함수를 부른다.
  window.navermap_authFailure = onAuthFailure;
  if (window.naver?.maps) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(keyId)}`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("네이버 지도 스크립트를 불러오지 못했어요."));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export async function createNaverMap(
  el: HTMLElement,
  keyId: string,
  opts: CreateMapOptions,
  onAuthFailure: () => void,
): Promise<MapAdapter> {
  await loadNaverMaps(keyId, onAuthFailure);
  const N = window.naver.maps;

  const map = new N.Map(el, {
    center: new N.LatLng(opts.center[0], opts.center[1]),
    zoom: opts.zoom,
    zoomControl: false,
    mapDataControl: false,
    scaleControl: false,
  });

  let lastMarkerClick = 0;
  const listeners: any[] = [];
  listeners.push(
    N.Event.addListener(map, "click", (e: any) => {
      if (Date.now() - lastMarkerClick < 300) return;
      opts.onClick([e.coord.lat(), e.coord.lng()]);
    }),
    N.Event.addListener(map, "zoom_changed", (z: number) => opts.onZoom(z)),
  );

  let markers: any[] = [];
  let polyline: any = null;

  return {
    setMarkers(specs: MarkerSpec[]) {
      markers.forEach((m) => m.setMap(null));
      markers = specs.map((s) => {
        const m = new N.Marker({
          map,
          position: new N.LatLng(s.lat, s.lng),
          icon: { content: s.html, size: new N.Size(...s.size), anchor: new N.Point(...s.anchor) },
          zIndex: s.zIndex,
          clickable: !!s.onClick,
        });
        if (s.onClick) {
          N.Event.addListener(m, "click", () => {
            lastMarkerClick = Date.now();
            s.onClick!();
          });
        }
        return m;
      });
    },
    setRoute(path: LatLng[]) {
      polyline?.setMap(null);
      polyline = null;
      if (path.length < 2) return;
      polyline = new N.Polyline({
        map,
        path: path.map(([a, b]) => new N.LatLng(a, b)),
        strokeColor: ROUTE_COLOR,
        strokeWeight: 5,
        strokeOpacity: 0.9,
        strokeStyle: "shortdot",
        strokeLineCap: "round",
      });
    },
    setCenter(pos: LatLng, zoom?: number, offsetY = 0) {
      const ll = new N.LatLng(pos[0], pos[1]);
      if (offsetY) {
        if (zoom !== undefined) map.setZoom(zoom, false);
        map.setCenter(ll);
        map.panBy(new N.Point(0, offsetY));
      } else if (zoom !== undefined) map.morph(ll, zoom);
      else map.panTo(ll);
    },
    fitTo(points: LatLng[]) {
      if (points.length === 0) return;
      if (points.length === 1) return map.morph(new N.LatLng(...points[0]), 17);
      const bounds = new N.LatLngBounds(new N.LatLng(...points[0]), new N.LatLng(...points[0]));
      points.forEach((p) => bounds.extend(new N.LatLng(...p)));
      map.fitBounds(bounds, { top: 140, right: 40, bottom: 180, left: 40 });
    },
    getZoom: () => map.getZoom(),
    getCenter: () => {
      const c = map.getCenter();
      return [c.lat(), c.lng()] as LatLng;
    },
    destroy() {
      markers.forEach((m) => m.setMap(null));
      polyline?.setMap(null);
      N.Event.removeListener(listeners);
      map.destroy();
    },
  };
}
