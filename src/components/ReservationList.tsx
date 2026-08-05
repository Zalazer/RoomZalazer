import type { Reservation } from "../hooks/useAppData"

type Props = {
  title: string
  reservations: Reservation[]
  timeMode: "kyiv" | "local"
  formatDateTime: (v: string) => string
  onDelete: (id: number) => void
  onEdit: (id: number) => void
  onOpenPast?: (r: Reservation) => void
}

const utc = (v: string) => new Date(`${v}Z`)

export default function ReservationList({
  title,
  reservations,
  timeMode,
  formatDateTime,
  onDelete,
  onEdit,
  onOpenPast,
}: Props) {
  const now = Date.now()

  const floorText = (n?: number) => {
    if (!n) return ""
    if (n === 1) return "1st"
    if (n === 2) return "2nd"
    if (n === 3) return "3rd"
    return `${n}th`
  }

  const endTime = (v: string) => {
    const full = formatDateTime(v)
    return full.split(", ").pop() || full
  }

  const duration = (a: string, b: string) =>
    Math.round((utc(b).getTime() - utc(a).getTime()) / 60000)

  const list = [...reservations].sort((a, b) => {
    const ac = a.status === "cancelled"
    const bc = b.status === "cancelled"

    if (ac !== bc) return ac ? 1 : -1

    return utc(a.start_at).getTime() - utc(b.start_at).getTime()
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
          const isCancelled = r.status === "cancelled"
          const isFinished = !isCancelled && utc(r.end_at).getTime() < now

          const status = isCancelled
            ? "cancelled"
            : isFinished
            ? "finished"
            : "reserved"

          const clickable = status !== "reserved"

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
                {formatDateTime(r.start_at)}
                {" - "}
                {endTime(r.end_at)}
                {" · "}
                {duration(r.start_at, r.end_at)}
                {" min"}
              </div>

              <div>{r.title}</div>

              <div className="small">
                {r.room.name}
                {" · "}
                {floorText(r.room.floor)}
                {" floor"}
                {" · Capacity "}
                {r.room.capacity}
                {r.room.area != null && ` · ${r.room.area} m²`}
                {r.room.windows && ` · ${r.room.windows}`}
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
