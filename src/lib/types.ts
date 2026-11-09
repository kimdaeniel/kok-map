export type CategoryId = "cafe" | "food" | "shop" | "attraction" | "market" | "parking" | "spot";
export type PlaceStatus = "want" | "visited";

export interface Place {
  id: string;
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
export type PlaceDraft = Omit<Place, "id" | "memo" | "status" | "createdAt">;

export type LatLng = [lat: number, lng: number];
