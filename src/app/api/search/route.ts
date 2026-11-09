import { NextResponse, type NextRequest } from "next/server";

export interface SearchItem {
  name: string;
  naverCategory: string;
  address: string;
  roadAddress: string;
  telephone: string;
  link: string;
  lat: number;
  lng: number;
}

interface NaverLocalItem {
  title: string;
  link: string;
  category: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

const stripTags = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

/**
 * 네이버 지역 검색 API 프록시.
 * Client Secret이 브라우저에 노출되지 않도록 서버에서만 호출한다.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });

  // 1순위: NAVER API HUB (네이버 클라우드 플랫폼). 2026.7.31부터 개발자센터 신규 신청이 막혀 이쪽을 쓴다.
  // 2순위: 예전 네이버 개발자센터 키 (이미 발급받은 경우, 2027.6.30까지 사용 가능)
  const hubId = process.env.NAVER_API_HUB_KEY_ID;
  const hubKey = process.env.NAVER_API_HUB_KEY;
  const legacyId = process.env.NAVER_SEARCH_CLIENT_ID;
  const legacySecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  let endpoint: string;
  let headers: Record<string, string>;
  if (hubId && hubKey) {
    endpoint = "https://naverapihub.apigw.ntruss.com/search/v1/local";
    headers = { "X-NCP-APIGW-API-KEY-ID": hubId, "X-NCP-APIGW-API-KEY": hubKey };
  } else if (legacyId && legacySecret) {
    endpoint = "https://openapi.naver.com/v1/search/local.json";
    headers = { "X-Naver-Client-Id": legacyId, "X-Naver-Client-Secret": legacySecret };
  } else {
    return NextResponse.json({ error: "NO_KEY", message: "검색 API 키가 설정되지 않았어요." }, { status: 501 });
  }

  const url = new URL(endpoint);
  url.searchParams.set("query", q);
  url.searchParams.set("display", "5"); // 지역 검색은 최대 5개
  url.searchParams.set("sort", "random"); // 정확도순

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    console.error("[search] naver error", res.status, detail);
    return NextResponse.json({ error: "NAVER_ERROR", message: `네이버 검색 오류 (${res.status})` }, { status: 502 });
  }

  const data = (await res.json()) as { items?: NaverLocalItem[]; result?: { items?: NaverLocalItem[] } };
  const raw = data.items ?? data.result?.items ?? [];
  const items: SearchItem[] = raw.map((it) => ({
    name: stripTags(it.title),
    naverCategory: it.category,
    address: it.address,
    roadAddress: it.roadAddress,
    telephone: it.telephone,
    link: it.link,
    // mapx/mapy는 경도/위도에 10^7을 곱한 정수
    lng: Number(it.mapx) / 1e7,
    lat: Number(it.mapy) / 1e7,
  }));
  return NextResponse.json({ items });
}
