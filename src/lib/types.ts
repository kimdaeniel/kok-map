export type CategoryId = "cafe" | "food" | "shop" | "attraction" | "market" | "parking" | "spot";
export type PlaceStatus = "want" | "visited";

export interface Trip {
  id: string;
  name: string;
  /** "2026-11-14" 형식 (선택) */
  startDate?: string;
  endDate?: string;
  createdAt: number;
}

/** 지금 보고 있는 여행 id, 또는 모든 여행 핀을 한 번에 보는 "all" */
/** 여행 id, "all"(모든 여행), "none"(아무 여행도 안 고른 빈 지도) */
export type TripView = string | "all" | "none";

export interface Place {
  id: string;
  /** 이 핀이 속한 여행. 같은 가게를 다른 여행에도 넣으면 핀이 하나 더 생긴다 (다녀옴은 여행마다 따로) */
  tripId: string;
  name: string;
  category: CategoryId;
  lat: number;
  lng: number;
  address?: string;
  roadAddress?: string;
  telephone?: string;
  /** 네이버 검색 결과의 원본 카테고리 (예: "카페,디저트") */
  naverCategory?: string;
  link?: string;
  memo: string;
  status: PlaceStatus;
  createdAt: number;
  visitedAt?: number;
}

/** 아직 저장하지 않은 장소 (검색 결과나 지도 탭으로 만든 것) */
export type PlaceDraft = Omit<Place, "id" | "tripId" | "memo" | "status" | "createdAt">;

export type LatLng = [lat: number, lng: number];
