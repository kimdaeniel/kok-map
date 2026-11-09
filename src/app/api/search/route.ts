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

  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!id || !secret) {
    return NextResponse.json({ error: "NO_KEY", message: "검색 API 키가 설정되지 않았어요." }, { status: 501 });
  }

  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", q);
  url.searchParams.set("display", "5"); // 지역 검색은 최대 5개
  url.searchParams.set("sort", "random"); // 정확도순

  const res = await fetch(url, {
    headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "NAVER_ERROR", message: `네이버 검색 오류 (${res.status})` }, { status: 502 });
  }

  const data = (await res.json()) as { items: NaverLocalItem[] };
  const items: SearchItem[] = data.items.map((it) => ({
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
