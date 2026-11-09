import type { LatLng } from "@/lib/types";
import { ROUTE_COLOR, type CreateMapOptions, type MapAdapter, type MarkerSpec } from "./adapter";

/** 네이버 지도 키가 없을 때 쓰는 무료 지도 (OpenStreetMap) */
export async function createLeafletMap(el: HTMLElement, opts: CreateMapOptions): Promise<MapAdapter> {
  const L = (await import("leaflet")).default;

  const map = L.map(el, { zoomControl: false, attributionControl: true }).setView(opts.center, opts.zoom);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  map.on("click", (e) => opts.onClick([e.latlng.lat, e.latlng.lng]));
  map.on("zoomend", () => opts.onZoom(map.getZoom()));

  let layer = L.layerGroup().addTo(map);
  let polyline: L.Polyline | null = null;

  return {
    setMarkers(specs: MarkerSpec[]) {
      layer.remove();
      layer = L.layerGroup().addTo(map);
      specs.forEach((s) => {
        const m = L.marker([s.lat, s.lng], {
          icon: L.divIcon({ html: s.html, className: "pin-icon", iconSize: s.size, iconAnchor: s.anchor }),
          zIndexOffset: s.zIndex * 100,
          interactive: !!s.onClick,
          keyboard: false,
        });
        if (s.onClick) m.on("click", s.onClick);
        m.addTo(layer);
      });
    },
    setRoute(path: LatLng[]) {
      polyline?.remove();
      polyline = null;
      if (path.length < 2) return;
      polyline = L.polyline(path, {
        color: ROUTE_COLOR,
        weight: 5,
        opacity: 0.9,
        dashArray: "1 10",
        lineCap: "round",
      }).addTo(map);
    },
    setCenter(pos: LatLng, zoom?: number, offsetY = 0) {
      const z = zoom ?? map.getZoom();
      const target = map.unproject(map.project(pos, z).add([0, offsetY]), z);
      if (z !== map.getZoom()) map.flyTo(target, z, { duration: 0.6 });
      else map.panTo(target);
    },
    fitTo(points: LatLng[]) {
      if (points.length === 0) return;
      if (points.length === 1) return void map.flyTo(points[0], 17, { duration: 0.6 });
      map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [40, 140], paddingBottomRight: [40, 180] });
    },
    getZoom: () => map.getZoom(),
    getCenter: () => {
      const c = map.getCenter();
      return [c.lat, c.lng] as LatLng;
    },
    destroy: () => void map.remove(),
  };
}
