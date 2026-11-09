"use client";

import { ICON_CREDITS } from "@/lib/credits";

/** ⓘ 버튼을 누르면 뜨는 아이콘 출처 화면 (Flaticon 무료 라이선스의 저작자 표시) */
export default function Credits({ onClose }: { onClose: () => void }) {
  return (
    <div className="credits-backdrop" onClick={onClose}>
      <section className="credits" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="아이콘 출처">
        <button className="sheet__close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        <h2>아이콘 출처</h2>
        <p>
          아이콘은{" "}
          <a href="https://www.flaticon.com" target="_blank" rel="noopener noreferrer">
            Flaticon
          </a>
          의 무료 아이콘을 사용했어요.
        </p>
        <ul>
          {ICON_CREDITS.map((c) => (
            <li key={c.file}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 작은 정적 아이콘 */}
              <img src={c.file} alt="" />
              <span>
                <b>{c.usage}</b> ·{" "}
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.author} - Flaticon
                </a>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
