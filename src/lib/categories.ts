import type { CategoryId } from "./types";

export interface CategoryInfo {
  label: string;
  /** 아이콘 이미지 (public/icons, Flaticon 무료 아이콘 128px 축소본. 출처는 lib/credits.ts) */
  icon: string;
  /** 핀 머리 색 (파스텔) */
  color: string;
}

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  cafe: { label: "카페", icon: "/icons/cafe.png", color: "#FFB8CF" },
  food: { label: "맛집", icon: "/icons/food.png", color: "#FFC98F" },
  shop: { label: "소품샵", icon: "/icons/shop.png", color: "#D2BCFF" },
  attraction: { label: "명소", icon: "/icons/attraction.png", color: "#FFE48A" },
  market: { label: "야시장", icon: "/icons/market.png", color: "#FF9E8A" },
  parking: { label: "주차장", icon: "/icons/parking.png", color: "#A9CBFF" },
  spot: { label: "기타", icon: "/icons/spot.png", color: "#9EE3C8" },
};

export const CATEGORY_ORDER: CategoryId[] = ["cafe", "food", "shop", "attraction", "market", "parking", "spot"];

/** 네이버 카테고리 문자열로 우리 카테고리를 추측한다. */
export function guessCategory(naverCategory = ""): CategoryId {
  const c = naverCategory;
  if (/주차/.test(c)) return "parking";
  if (/야시장|시장/.test(c)) return "market";
  if (/카페|디저트|베이커리|제과|빵|케이크|아이스크림|차,|찻집|전통찻집/.test(c)) return "cafe";
  if (/소품|잡화|선물|문구|팬시|인테리어|생활용품|액세서리|쇼핑|서점|꽃집|공방/.test(c)) return "shop";
  if (/음식점|한식|양식|중식|일식|분식|식당|국수|고기|육류|해물|치킨|피자|햄버거|술집|요리|비빔밥|백반|국밥|순대|면|돈가스|초밥|라멘|브런치/.test(c))
    return "food";
  if (/관광|명소|유적|문화재|사적|고궁|궁궐|성당|사찰|절,|향교|한옥마을|전망대|공원|박물관|미술관|기념관|테마거리|랜드마크/.test(c))
    return "attraction";
  return "spot";
}
