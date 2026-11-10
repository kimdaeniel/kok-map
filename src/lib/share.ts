import { CATEGORY_ORDER } from "./categories";
import type { CategoryId, Place, Trip } from "./types";

/**
 * 여행 공유 링크.
 * 서버 없이 여행 이름·날짜·핀·루트를 압축해서 링크의 # 뒤에 넣는다.
 * (# 뒤는 서버로 전송되지 않으므로 핀 정보가 어디에도 저장되지 않는다)
 */

export const SHARE_PREFIX = "#trip=";

/** 링크 안에 들어가는 짧은 형식 */
interface Packed {
  v: 1;
  n: string; // 여행 이름
  s?: string; // 가는 날
  e?: string; // 오는 날
  /** [이름, 위도, 경도, 카테고리 번호, 메모, 도로명주소, 전화, 네이버 분류] */
  p: [string, number, number, number, string?, string?, string?, string?][];
  r?: number[]; // 루트 (p의 순서 번호)
}

/** 받은 쪽에서 쓰는 여행 정보 */
export interface SharedTrip {
  name: string;
  startDate?: string;
  endDate?: string;
  places: Omit<Place, "id" | "tripId" | "status" | "createdAt">[];
  /** 루트 (places의 순서 번호) */
  route: number[];
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

const round = (x: number) => Math.round(x * 1e6) / 1e6;

export async function makeShareUrl(trip: Trip, places: Place[], route: string[]): Promise<string> {
  const packed: Packed = {
    v: 1,
    n: trip.name,
    s: trip.startDate,
    e: trip.endDate,
    p: places.map((p) => {
      const row: Packed["p"][number] = [
        p.name,
        round(p.lat),
        round(p.lng),
        CATEGORY_ORDER.indexOf(p.category),
        p.memo || "",
        p.roadAddress || p.address || "",
        p.telephone || "",
        p.naverCategory || "",
      ];
      while (row.length > 4 && !row[row.length - 1]) row.pop(); // 빈 칸은 빼서 링크를 짧게
      return row;
    }),
  };
  const r = route.map((id) => places.findIndex((p) => p.id === id)).filter((i) => i >= 0);
  if (r.length) packed.r = r;

  const json = new TextEncoder().encode(JSON.stringify(packed));
  const zipped = await pipe(json, new CompressionStream("deflate-raw"));
  return `${location.origin}/${SHARE_PREFIX}${toBase64Url(zipped)}`;
}

/** 링크의 # 부분을 풀어서 여행 정보로 바꾼다. 잘못된 링크면 null */
export async function readShareHash(hash: string): Promise<SharedTrip | null> {
  if (!hash.startsWith(SHARE_PREFIX)) return null;
  try {
    const bytes = await pipe(fromBase64Url(hash.slice(SHARE_PREFIX.length)), new DecompressionStream("deflate-raw"));
    const d = JSON.parse(new TextDecoder().decode(bytes)) as Packed;
    if (d.v !== 1 || typeof d.n !== "string" || !Array.isArray(d.p)) return null;
    return {
      name: d.n,
      startDate: d.s,
      endDate: d.e,
      places: d.p.map(([name, lat, lng, c, memo, addr, tel, ncat]) => ({
        name: String(name),
        lat: Number(lat),
        lng: Number(lng),
        category: (CATEGORY_ORDER[c] ?? "spot") as CategoryId,
        memo: memo || "",
        roadAddress: addr || undefined,
        telephone: tel || undefined,
        naverCategory: ncat || undefined,
      })),
      route: (d.r ?? []).filter((i) => i >= 0 && i < d.p.length),
    };
  } catch {
    return null;
  }
}

/** 휴대폰이면 공유 창(카톡 등), 아니면 클립보드에 복사. 어떻게 했는지 돌려준다 */
export async function shareLink(title: string, url: string): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text: `콕콕 지도 · ${title}`, url });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
