import type { LatLng } from "@/lib/types";

export interface MarkerSpec {
  id: string;
  lat: number;
  lng: number;
  html: string;
  size: [number, number];
  anchor: [number, number];
  zIndex: number;
  onClick?: () => void;
}

/** 네이버 지도 / OpenStreetMap(Leaflet)을 같은 방식으로 다루기 위한 공통 인터페이스 */
export interface MapAdapter {
  setMarkers(specs: MarkerSpec[]): void;
  setRoute(path: LatLng[]): void;
  /** offsetY(px)만큼 지점을 화면 위쪽에 보이게 한다 (하단 카드에 가리지 않도록) */
  setCenter(pos: LatLng, zoom?: number, offsetY?: number): void;
  fitTo(points: LatLng[]): void;
  getZoom(): number;
  destroy(): void;
}

export interface CreateMapOptions {
  center: LatLng;
  zoom: number;
  onClick: (pos: LatLng) => void;
  onZoom: (zoom: number) => void;
}

export const ROUTE_COLOR = "#FF7BA3";
