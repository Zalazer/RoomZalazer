import type { Reservation } from "../hooks/useAppData"

type Props = {
  title: string
  reservations: Reservation[]
  timeMode: "kyiv" | "local"
  formatDateTime: (v: string) => string
  nowUtcMs: number
  onDelete: (id: number) => void
  onEdit: (id: number) => void
  onOpenPast?: (r: Reservation) => void
}

const safeUtc = (v?: string | null) => {
  if (!v) return null
  const d = new Date(`${String(v).replace(" ", "T")}Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

export default function ReservationList({
  title,
  reservations,
  timeMode,
  formatDateTime,
  nowUtcMs,
  onDelete,
  onEdit,
  onOpenPast,
}: Props) {
  const floorText = (n?: number) => {
    if (n == null) return ""
    if (n === 1) return "1st"
    if (n === 2) return "2nd"
    if (n === 3) return "3rd"
    return `${n}th`
  }

  const safeFormatDateTime = (v?: string | null) => {
    if (!v) return "Unknown time"
    try {
      return formatDateTime(v)
    } catch {
      return "Unknown time"
    }
  }

  const endTime = (v?: string | null) => {
    const full = safeFormatDateTime(v)
    return full.split(", ").pop() || full
  }

  const duration = (a?: string | null, b?: string | null) => {
    const start = safeUtc(a)
    const end = safeUtc(b)

    if (!start || !end) return null

    const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
    return Number.isFinite(minutes) && minutes >= 0 ? minutes : null
  }

  const list = [...reservations].sort((a, b) => {
    const ac = a.status === "cancelled"
    const bc = b.status === "cancelled"

    if (ac !== bc) return ac ? 1 : -1

    const at = safeUtc(a.start_at)?.getTime() ?? Number.MAX_SAFE_INTEGER
    const bt = safeUtc(b.start_at)?.getTime() ?? Number.MAX_SAFE_INTEGER

    return at - bt
  })

  return (
    <div className="card">
      <h2>
        {title}
        {title.toLowerCase().includes("past") && (
          <span className="small">
            &nbsp;(Tap to view room)
          </span>
        )}
      </h2>

      <div
        className="small"
        style={{ marginBottom: "10px" }}
      >
        Viewing in {timeMode === "kyiv" ? "Kyiv time" : "your local time"}
      </div>

      {!list.length ? (
        <div className="small">No reservations.</div>
      ) : (
        list.map((r) => {
          const endDate = safeUtc(r.end_at)
          const isCancelled = r.status === "cancelled"
          const isFinished = !isCancelled && !!endDate && endDate.getTime() < nowUtcMs

          const status = isCancelled
            ? "cancelled"
            : isFinished
            ? "finished"
            : "reserved"

          const clickable = status !== "reserved"
          const mins = duration(r.start_at, r.end_at)

          return (
            <div
              key={r.id}
              className="reservation"
              style={{
                marginBottom: "8px",
                cursor: clickable ? "pointer" : "default",
                background:
                  status === "finished"
                    ? "rgba(255,255,255,.05)"
                    : status === "cancelled"
                    ? "rgba(255,80,80,.06)"
                    : undefined,
              }}
              onClick={() => {
                if (clickable) onOpenPast?.(r)
              }}
            >
              <div className="title">
                {safeFormatDateTime(r.start_at)}
                {" - "}
                {endTime(r.end_at)}
                {mins !== null && (
                  <>
                    {" · "}
                    {mins}
                    {" min"}
                  </>
                )}
              </div>

              <div>{r.title || "Untitled reservation"}</div>

              <div className="small">
                {r.room?.name || "Unknown room"}
                {r.room?.floor != null && (
                  <>
                    {" · "}
                    {floorText(r.room.floor)}
                    {" floor"}
                  </>
                )}
                {" · Capacity "}
                {r.room?.capacity ?? "-"}
                {r.room?.area != null && ` · ${r.room.area} m²`}
                {r.room?.windows && ` · ${r.room.windows}`}
                {" · "}
                {status}
              </div>

              {status === "reserved" && (
                <div className="actions">
                  <button
                    className="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(r.id)
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(r.id)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
