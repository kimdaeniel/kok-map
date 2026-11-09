import type { LatLng } from "./types";

/** 두 지점 사이 직선 거리 (m) */
export function distance([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function pathDistance(path: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < path.length; i++) sum += distance(path[i - 1], path[i]);
  return sum;
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

/** 직선 거리로 대략적인 도보 시간(분)을 추정한다. 실제 길은 직선보다 약 1.3배 길다고 가정. */
export function estimateWalkMinutes(m: number): number {
  return Math.max(1, Math.round((m * 1.3) / 75)); // 분당 75m (4.5km/h)
}
