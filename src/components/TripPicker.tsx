"use client";

import { useState } from "react";
import { tripDates } from "@/lib/trips";
import type { Trip, TripView } from "@/lib/types";

interface Props {
  trips: Trip[];
  currentTrip: Trip | null; // null이면 전체 보기 또는 안 고름
  isAll: boolean;
  counts: Record<string, number>;
  totalCount: number;
  onSelect: (view: TripView) => void;
  onCreate: (name: string, startDate?: string, endDate?: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<Trip, "name" | "startDate" | "endDate">>) => void;
  onDelete: (id: string) => void;
}

/** 여행 이름·날짜 입력 칸 (새 여행 / 여행 수정 공통) */
function TripForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial?: Trip;
  submitLabel: string;
  onSubmit: (name: string, startDate?: string, endDate?: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [start, setStart] = useState(initial?.startDate ?? "");
  const [end, setEnd] = useState(initial?.endDate ?? "");

  return (
    <form
      className="trip-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        // 끝 날짜가 시작보다 앞이면 서로 바꿔준다
        const [s, en] = start && end && end < start ? [end, start] : [start, end];
        onSubmit(name.trim(), s || undefined, en || undefined);
      }}
    >
      <input
        className="trip-form__name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="여행 이름 (예: 전주 여행)"
        autoFocus
      />
      <div className="trip-form__dates">
        <label>
          <span>가는 날</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          <span>오는 날</span>
          <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <div className="trip-form__btns">
        {onDelete && (
          <button type="button" className="btn btn--ghost trip-form__delete" onClick={onDelete}>
            여행 삭제
          </button>
        )}
        <button type="button" className="btn" onClick={onCancel}>
          취소
        </button>
        <button className="btn btn--primary" disabled={!name.trim()}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function TripPicker({ trips, currentTrip, isAll, counts, totalCount, onSelect, onCreate, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  // 목록 / 새 여행 만들기 / 여행 수정
  const [mode, setMode] = useState<{ kind: "list" } | { kind: "new" } | { kind: "edit"; trip: Trip }>({ kind: "list" });

  const close = () => {
    setOpen(false);
    setMode({ kind: "list" });
  };

  const label = currentTrip ? currentTrip.name : isAll ? "모든 여행" : "여행 고르기";
  const dates = currentTrip ? tripDates(currentTrip) : "";

  return (
    <>
      <button className="trip-btn" onClick={() => setOpen(true)} aria-label="여행 바꾸기">
        <span className="trip-btn__icon" aria-hidden="true">
          🧳
        </span>
        <b>{label}</b>
        {dates && <small>{dates}</small>}
        <span className="trip-btn__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="credits-backdrop" onClick={close}>
          <section className="credits trips" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="여행 고르기">
            <button className="sheet__close" onClick={close} aria-label="닫기">
              ✕
            </button>

            {mode.kind === "list" && (
              <>
                <h2>여행 고르기</h2>
                <p>고른 여행의 핀만 지도에 보여요.</p>
                <ul className="trips__list">
                  <li className={!currentTrip && !isAll ? "trips__item--on" : ""}>
                    <button
                      className="trips__pick"
                      onClick={() => {
                        onSelect("none");
                        close();
                      }}
                    >
                      <b>선택 안 함</b>
                      <small>핀 없는 빈 지도</small>
                    </button>
                  </li>
                  {trips.map((t) => {
                    const on = currentTrip?.id === t.id;
                    return (
                      <li key={t.id} className={on ? "trips__item--on" : ""}>
                        <button
                          className="trips__pick"
                          onClick={() => {
                            onSelect(t.id);
                            close();
                          }}
                        >
                          <b>{t.name}</b>
                          <small>
                            {[tripDates(t), `${counts[t.id] ?? 0}곳`].filter(Boolean).join(" · ")}
                          </small>
                        </button>
                        <button className="trips__edit" onClick={() => setMode({ kind: "edit", trip: t })} aria-label={`${t.name} 수정`}>
                          수정
                        </button>
                      </li>
                    );
                  })}
                  <li className={isAll ? "trips__item--on" : ""}>
                    <button
                      className="trips__pick"
                      onClick={() => {
                        onSelect("all");
                        close();
                      }}
                    >
                      <b>모든 여행 한 번에 보기</b>
                      <small>{totalCount}곳</small>
                    </button>
                  </li>
                </ul>
                <button className="btn btn--primary btn--block" onClick={() => setMode({ kind: "new" })}>
                  ＋ 새 여행 만들기
                </button>
              </>
            )}

            {mode.kind === "new" && (
              <>
                <h2>새 여행</h2>
                <p>여행을 만들면 바로 그 여행으로 바뀌어요.</p>
                <TripForm
                  submitLabel="만들기"
                  onCancel={() => setMode({ kind: "list" })}
                  onSubmit={(name, s, e) => {
                    onCreate(name, s, e);
                    close();
                  }}
                />
              </>
            )}

            {mode.kind === "edit" && (
              <>
                <h2>여행 수정</h2>
                <p>{counts[mode.trip.id] ?? 0}곳이 저장되어 있어요.</p>
                <TripForm
                  initial={mode.trip}
                  submitLabel="저장"
                  onCancel={() => setMode({ kind: "list" })}
                  onSubmit={(name, s, e) => {
                    onUpdate(mode.trip.id, { name, startDate: s, endDate: e });
                    setMode({ kind: "list" });
                  }}
                  onDelete={() => {
                    const n = counts[mode.trip.id] ?? 0;
                    const msg = n
                      ? `'${mode.trip.name}' 여행과 저장된 핀 ${n}곳을 모두 삭제할까요?`
                      : `'${mode.trip.name}' 여행을 삭제할까요?`;
                    if (confirm(msg)) {
                      onDelete(mode.trip.id);
                      setMode({ kind: "list" });
                    }
                  }}
                />
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
