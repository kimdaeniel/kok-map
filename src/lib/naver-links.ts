import type { Place } from "./types";

function appName(): string {
  return typeof window === "undefined" ? "kok-map" : window.location.hostname || "kok-map";
}

/** "전북 전주시 완산구 ..." → "전주시 완산구" 처럼 지역 이름만 뽑아 검색 정확도를 높인다. */
function region(p: Pick<Place, "roadAddress" | "address">): string {
  const addr = p.roadAddress || p.address || "";
  return addr.split(" ").slice(1, 3).join(" ");
}

function searchQuery(p: Pick<Place, "name" | "roadAddress" | "address">): string {
  return `${region(p)} ${p.name}`.trim();
}

export function naverWebPlaceUrl(p: Pick<Place, "name" | "roadAddress" | "address">): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(searchQuery(p))}`;
}

export function naverAppPlaceUrl(p: Pick<Place, "name" | "roadAddress" | "address">): string {
  return `nmap://search?query=${encodeURIComponent(searchQuery(p))}&appname=${encodeURIComponent(appName())}`;
}

export function naverAppWalkUrl(p: Pick<Place, "name" | "lat" | "lng">): string {
  const q = new URLSearchParams({
    dlat: String(p.lat),
    dlng: String(p.lng),
    dname: p.name,
    appname: appName(),
  });
  return `nmap://route/walk?${q.toString()}`;
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** 휴대폰이면 네이버 지도 앱을 열고, 앱이 없거나 PC면 네이버 지도 웹을 연다. */
export function openNaver(appUrl: string, webUrl: string) {
  if (!isMobile()) {
    window.open(webUrl, "_blank", "noopener");
    return;
  }
  const timer = window.setTimeout(() => {
    if (!document.hidden) window.location.href = webUrl;
  }, 1500);
  document.addEventListener("visibilitychange", () => window.clearTimeout(timer), { once: true });
  window.location.href = appUrl;
}
