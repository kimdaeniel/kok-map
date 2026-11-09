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

interface KakaoPlace {
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  x: string;
  y: string;
}

/** 카카오 키워드 검색. 지도 가운데(lat/lng)가 있으면 그 근처(20km)부터 찾고, 없으면 전국에서 찾는다. */
async function searchKakao(key: string, q: string, lat?: number, lng?: number): Promise<SearchItem[] | null> {
  const run = async (nearby: boolean) => {
    const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    url.searchParams.set("query", q);
    url.searchParams.set("size", "15");
    if (lat !== undefined && lng !== undefined) {
      url.searchParams.set("x", String(lng));
      url.searchParams.set("y", String(lat));
      if (nearby) url.searchParams.set("radius", "20000");
    }
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, cache: "no-store" });
    if (!res.ok) {
      console.error("[search] kakao error", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { documents: KakaoPlace[] };
    return data.documents.map<SearchItem>((d) => ({
      name: d.place_name,
      naverCategory: d.category_name, // 예: "음식점 > 카페", "교통,수송 > 주차장"
      address: d.address_name,
      roadAddress: d.road_address_name,
      telephone: d.phone,
      link: d.place_url,
      lat: Number(d.y),
      lng: Number(d.x),
    }));
  };

  const hasCenter = lat !== undefined && lng !== undefined;
  const near = await run(hasCenter);
  if (near === null) return null;
  if (near.length > 0 || !hasCenter) return near;
  return run(false); // 근처에 없으면 전국에서 다시
}

/**
 * 가게 검색 프록시. 키가 브라우저에 노출되지 않도록 서버에서만 호출한다.
 * 1) 카카오 키워드 검색 (지금 보는 지도 근처 우선, 최대 15개)
 * 2) 결과가 없거나 카카오 키가 없으면 네이버 지역 검색 (최대 5개)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });

  const latN = Number(sp.get("lat"));
  const lngN = Number(sp.get("lng"));
  const hasCenter = sp.has("lat") && sp.has("lng") && Number.isFinite(latN) && Number.isFinite(lngN);

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (kakaoKey) {
    const kakao = await searchKakao(kakaoKey, q, hasCenter ? latN : undefined, hasCenter ? lngN : undefined);
    if (kakao && kakao.length > 0) return NextResponse.json({ items: kakao, source: "kakao" });
  }

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
  } else if (kakaoKey) {
    return NextResponse.json({ items: [], source: "kakao" });
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
  return NextResponse.json({ items, source: "naver" });
}
