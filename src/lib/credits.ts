/**
 * 아이콘 출처 (Flaticon 무료 라이선스: 저작자 표시 필요).
 * 앱의 ⓘ 버튼 → "아이콘 출처" 화면에 그대로 표시된다.
 * 새 아이콘을 추가하면 여기에도 꼭 추가할 것.
 */
export interface IconCredit {
  /** 앱에서 쓰는 곳 */
  usage: string;
  /** public 아래 파일 */
  file: string;
  author: string;
  /** Flaticon 아이콘 페이지 */
  url: string;
}

export const ICON_CREDITS: IconCredit[] = [
  { usage: "카페", file: "/icons/cafe.png", author: "Magnific", url: "https://www.flaticon.com/free-icon/cake_1182109" },
  { usage: "맛집", file: "/icons/food.png", author: "juicy_fish", url: "https://www.flaticon.com/free-icon/vegan-food_16836063" },
  { usage: "소품샵", file: "/icons/shop.png", author: "BomSymbols", url: "https://www.flaticon.com/free-icon/snowman_2283403" },
  { usage: "명소", file: "/icons/attraction.png", author: "MEDZ", url: "https://www.flaticon.com/free-icon/castle_5846839" },
  { usage: "야시장", file: "/icons/market.png", author: "juicy_fish", url: "https://www.flaticon.com/free-icon/market_5769892" },
  { usage: "주차장", file: "/icons/parking.png", author: "juicy_fish", url: "https://www.flaticon.com/free-icon/parking_5695089" },
  { usage: "기타", file: "/icons/spot.png", author: "juicy_fish", url: "https://www.flaticon.com/free-icon/dslr-camera_5724320" },
  { usage: "핀 꽂기 버튼", file: "/icons/thumbtack.png", author: "juicy_fish", url: "https://www.flaticon.com/free-icon/thumb-tack_12461348" },
  { usage: "핀 꽂기 안내", file: "/icons/location-pin.png", author: "juicy_fish", url: "https://www.flaticon.com/free-icon/location-pin_9482447" },
];
