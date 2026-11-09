import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

/** 카테고리 아이콘 이미지 (필터 버튼, 시트, 검색 결과, 루트 목록에서 공통으로 사용) */
export default function CategoryIcon({ category, size = 18 }: { category: CategoryId; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 작은 정적 아이콘이라 next/image 최적화가 필요 없음
    <img className="cat-icon" src={CATEGORIES[category].icon} alt="" width={size} height={size} draggable={false} />
  );
}
