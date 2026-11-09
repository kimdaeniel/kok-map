import type { PlaceDraft, CategoryId } from "./types";

/** 화면 미리보기용 샘플 핀 (전주 한옥마을 주변, 실제 가게 아님) */
export const SAMPLE_PLACES: (PlaceDraft & { category: CategoryId; memo: string })[] = [
  { name: "샘플 딸기케이크 카페", category: "cafe", lat: 35.8165, lng: 127.1512, roadAddress: "전북 전주시 완산구 샘플로 1", memo: "딸기케이크 꼭 먹기" },
  { name: "샘플 한옥 찻집", category: "cafe", lat: 35.8138, lng: 127.1548, roadAddress: "전북 전주시 완산구 샘플로 2", memo: "" },
  { name: "샘플 비빔밥집", category: "food", lat: 35.8152, lng: 127.1497, roadAddress: "전북 전주시 완산구 샘플로 3", memo: "점심" },
  { name: "샘플 칼국수", category: "food", lat: 35.8129, lng: 127.1525, roadAddress: "전북 전주시 완산구 샘플로 4", memo: "" },
  { name: "샘플 곰돌이 소품샵", category: "shop", lat: 35.8173, lng: 127.1541, roadAddress: "전북 전주시 완산구 샘플로 5", memo: "엽서 사기" },
  { name: "샘플 전망 포토스팟", category: "spot", lat: 35.8121, lng: 127.1561, roadAddress: "전북 전주시 완산구 샘플로 6", memo: "" },
];

export const DEFAULT_CENTER: [number, number] = [35.8148, 127.1529]; // 전주 한옥마을
