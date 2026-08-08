import { useEffect, useMemo, useState } from "react"
import type { Reservation } from "../hooks/useAppData"

type Props = {
  open: boolean
  type: "before_start" | "before_end" | null
  reservation: Reservation | null
  endsAtMs: number | null
  onClose: () => void
}

const formatClock = (totalSeconds: number) => {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export default function ReminderPopup({
  open,
  type,
  reservation,
  endsAtMs,
  onClose,
}: Props) {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!open) return

    setNowMs(Date.now())

    const id = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(id)
  }, [open])

  const secondsLeft = useMemo(() => {
    if (!open || !endsAtMs) return 0
    return Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000))
  }, [open, endsAtMs, nowMs])

  useEffect(() => {
    if (!open) return
    if (secondsLeft <= 0) onClose()
  }, [open, secondsLeft, onClose])

  if (!open || !reservation || !type) return null

  const heading =
    type === "before_start"
      ? "Reservation starts soon"
      : "Reservation ends soon"

  const description =
    type === "before_start"
      ? "Time remaining until the meeting starts."
      : "Time remaining until the meeting ends."

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2200,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          margin: 0,
          padding: 20,
          borderRadius: 18,
          textAlign: "center",
        }}
      >
        <div className="section-title">{heading}</div>

        <div className="small" style={{ marginTop: 8, opacity: 0.85 }}>
          {description}
        </div>

        <div style={{ marginTop: 16, fontWeight: 700, fontSize: 18 }}>
          {reservation.title || "Untitled reservation"}
        </div>

        <div className="small" style={{ marginTop: 6, opacity: 0.85 }}>
          Room: {reservation.room?.name || `#${reservation.room_id}`}
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "0.02em",
          }}
        >
          {secondsLeft}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 20,
            fontWeight: 600,
            opacity: 0.9,
          }}
        >
          {formatClock(secondsLeft)}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 22 }}>
          <button type="button" className="btn primary" onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
