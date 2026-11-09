import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "콕콕 지도",
    short_name: "콕콕 지도",
    description: "가고 싶은 곳을 귀여운 핀으로 콕콕 꽂아두는 여행 지도",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8F3",
    theme_color: "#FF7BA3",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
