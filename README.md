# 🍰 콕콕 지도 (kok-map)

가고 싶은 가게를 **귀여운 핀**으로 지도에 콕콕 꽂아두는 여행 지도예요.
핀만 봐도 어떤 가게인지 알 수 있고, 다녀온 곳은 체크하고, 오늘 루트도 짤 수 있어요.

| 핀 | 의미 |
|---|---|
| 🍰 분홍 | 카페 |
| 🍜 주황 | 맛집 |
| 🧸 보라 | 소품샵 |
| 📸 민트 | 기타 (포토스팟, 명소 등) |
| 숫자 뱃지 ①②③ | 오늘 루트 순서 |
| 회색 + ✓ | 다녀온 곳 |

## 기능

- 🔍 네이버 지역 검색으로 가게를 찾아 핀 꽂기 (카테고리 자동 추측)
- ＋ 버튼 → 지도를 탭해서 직접 핀 꽂기
- 핀 탭 → 정보 카드 (주소, 전화, 메모, 다녀옴 체크, 루트 추가)
- **N 네이버 지도에서 보기** → 네이버 지도 앱/웹에서 그 가게 화면 열기 (사진·리뷰·메뉴)
- 🚶 **길찾기** → 네이버 지도 앱 도보 길찾기로 연결
- 🗺️ 오늘 루트: 순서 바꾸기, 점선 연결, 거리/도보 시간 추정, "다음 장소 길찾기"
- 🎯 실시간 내 위치
- 카테고리 필터, "안 가본 곳만" 보기
- 데이터는 브라우저에 자동 저장 (localStorage)
- 휴대폰에서 "홈 화면에 추가"하면 앱처럼 실행 (PWA)

## 시작하기

```bash
npm install
cp .env.example .env.local   # 키 입력
npm run dev                  # http://localhost:3000
```

키가 없어도 실행돼요. 네이버 지도 키가 없으면 임시 지도(OpenStreetMap)가 나오고,
검색 키가 없으면 ＋ 버튼으로 직접 핀을 꽂을 수 있어요. "샘플 핀 구경하기"로 미리 볼 수도 있어요.

## 키 발급

### 1. 네이버 지도 (NCP Maps) → `NEXT_PUBLIC_NAVER_MAP_KEY_ID`

1. [ncloud.com](https://www.ncloud.com) 가입 → 결제수단 등록 (무료 이용량 안에서도 등록 필수)
2. 콘솔 → **Services → Application Services → Maps**
3. **Application 등록** → **Dynamic Map** 체크
4. **Web 서비스 URL**에 `http://localhost:3000` (배포 후엔 실제 주소도) 등록
5. 발급된 **Client ID**를 `.env.local`에 입력

> 2025년 7월부터 예전 "AI·NAVER API" 지도 상품은 무료 이용량이 없어졌어요. 반드시 새 **Maps** 상품으로 등록하세요.
> 인증에 실패하면 화면 상단에 안내가 뜨고 임시 지도로 바뀌어요.

### 2. 가게 검색 (NAVER API HUB) → `NAVER_API_HUB_KEY_ID`, `NAVER_API_HUB_KEY`

네이버 검색 API는 **네이버 클라우드 플랫폼의 NAVER API HUB**로 옮겨졌어요.
(2026.7.31부터 네이버 개발자센터에서는 검색 API를 새로 신청할 수 없어요.)

1. 지도 키를 받은 같은 [네이버 클라우드 플랫폼](https://www.ncloud.com) 콘솔에서 **NAVER API HUB** 서비스로 이동
2. 앱(Application) 등록 → **검색 > 지역** API 사용 설정
3. 발급된 Client ID / Client Secret을 `.env.local`에 입력

> Secret은 서버(`/api/search`)에서만 쓰여서 브라우저에 노출되지 않아요. 절대 커밋하지 마세요.
> 예전 개발자센터 검색 키가 이미 있다면 `NAVER_SEARCH_CLIENT_ID/SECRET`에 넣어도 동작해요 (2027.6.30까지).

## 구조

```
src/
  app/
    page.tsx              # 메인 화면
    api/search/route.ts   # 네이버 지역 검색 프록시
    globals.css           # 핀 디자인 포함 모든 스타일
  components/
    MapView.tsx           # 지도 (네이버 ↔ OpenStreetMap 자동 전환)
    map/naverAdapter.ts   # 네이버 지도 구현
    map/leafletAdapter.ts # OpenStreetMap 구현
    PlaceSheet.tsx        # 핀 정보 카드 / 새 핀 저장 카드
    RoutePanel.tsx        # 오늘 루트
    SearchBar.tsx, FilterBar.tsx
  lib/
    categories.ts         # 카테고리(이모지·색) 정의 ← 새 카테고리는 여기에
    pin.ts                # 핀 HTML
    usePlaces.ts          # 저장/불러오기
    naver-links.ts        # 네이버 지도 앱/웹 링크
```

## 다음에 해볼 것

- 이모지 대신 직접 그린 귀여운 핀 일러스트(SVG)로 교체
- 여행별로 지도 나누기 (전주 여행, 부산 여행…)
- 로그인 + 클라우드 저장 (Supabase/Firebase)으로 폰·PC 동기화, 친구와 공유
- 다녀온 곳에 사진 첨부
