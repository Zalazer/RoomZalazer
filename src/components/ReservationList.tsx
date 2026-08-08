import type { Reservation, Room } from "../hooks/useAppData"

type RoomSortField = "name" | "floor" | "seats"

type Props = {
  title: string
  reservations: Reservation[]
  rooms: Room[]
  sortBy: RoomSortField
  timeMode: "kyiv" | "local"
  formatDateTime: (v: string) => string
  nowUtcMs: number
  onDelete: (id: number) => void
  onEdit: (id: number) => void
  onOpenPast?: (r: Reservation) => void
}

const safeUtc = (v?: string | null) => {
  if (!v) return null
  const raw = String(v)
  const d = new Date(raw.endsWith("Z") ? raw : `${raw.replace(" ", "T")}Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

const cutSingleLine = (value: unknown, max = 72) => {
  const text = String(value ?? "").trim()
  if (!text) return ""
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export default function ReservationList({
  title,
  reservations,
  rooms,
  sortBy,
  timeMode,
  formatDateTime,
  nowUtcMs,
  onDelete,
  onEdit,
  onOpenPast,
}: Props) {
  const roomById = new Map(rooms.map((room) => [room.id, room]))

  const floorText = (n?: number) => {
    if (n == null) return ""
    if (n === 1) return "1st floor"
    if (n === 2) return "2nd floor"
    if (n === 3) return "3rd floor"
    return `${n}th floor`
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

  const getReservationRoom = (r: Reservation) => r.room ?? roomById.get(r.room_id)

  const compareRoom = (a: Reservation, b: Reservation) => {
    const ar = getReservationRoom(a)
    const br = getReservationRoom(b)

    if (sortBy === "name") {
      const byName = String(ar?.name || "").localeCompare(
        String(br?.name || ""),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      )
      if (byName !== 0) return byName

      const byFloor = Number(ar?.floor ?? 0) - Number(br?.floor ?? 0)
      if (byFloor !== 0) return byFloor

      return Number(ar?.capacity ?? 0) - Number(br?.capacity ?? 0)
    }

    if (sortBy === "floor") {
      const byFloor = Number(ar?.floor ?? 0) - Number(br?.floor ?? 0)
      if (byFloor !== 0) return byFloor

      const byName = String(ar?.name || "").localeCompare(
        String(br?.name || ""),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      )
      if (byName !== 0) return byName

      return Number(ar?.capacity ?? 0) - Number(br?.capacity ?? 0)
    }

    const bySeats = Number(ar?.capacity ?? 0) - Number(br?.capacity ?? 0)
    if (bySeats !== 0) return bySeats

    const byName = String(ar?.name || "").localeCompare(
      String(br?.name || ""),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    )
    if (byName !== 0) return byName

    return Number(ar?.floor ?? 0) - Number(br?.floor ?? 0)
  }

  const roomMetaLine = (r: Reservation, status: string) => {
    const room = getReservationRoom(r)
    const parts: string[] = []

    if (room?.name) parts.push(room.name)
    if (room?.floor != null) parts.push(floorText(room.floor))
    if (room?.capacity != null) parts.push(`${room.capacity} seats`)
    if (typeof room?.area === "number" && room.area > 0) {
      parts.push(`${room.area} m²`)
    }

    const windowsValue = room?.windows != null ? String(room.windows).trim() : ""

    if (windowsValue && windowsValue !== "0") {
      parts.push(`Windows: ${windowsValue}`)
    }

    parts.push(status)

    return parts.join(" · ")
  }

  const getStatusRank = (r: Reservation) => {
    const startDate = safeUtc(r.start_at)
    const endDate = safeUtc(r.end_at)
    const isCancelled = r.status === "cancelled"
    const isActive =
      !isCancelled && !!startDate && !!endDate &&
      startDate.getTime() <= nowUtcMs && endDate.getTime() > nowUtcMs
    const isFuture =
      !isCancelled && !!startDate && startDate.getTime() > nowUtcMs
    const isFinished =
      !isCancelled && !!endDate && endDate.getTime() <= nowUtcMs

    if (isActive) return 0
    if (isFuture) return 1
    if (isFinished) return 2
    return 3
  }

  const getStartMs = (r: Reservation) =>
    safeUtc(r.start_at)?.getTime() ?? Number.MAX_SAFE_INTEGER

  const getEndMs = (r: Reservation) =>
    safeUtc(r.end_at)?.getTime() ?? Number.MAX_SAFE_INTEGER

  const list = [...reservations].sort((a, b) => {
    const rankA = getStatusRank(a)
    const rankB = getStatusRank(b)

    if (rankA !== rankB) return rankA - rankB

    if (rankA === 0) {
      const aEnd = getEndMs(a)
      const bEnd = getEndMs(b)
      if (aEnd !== bEnd) return aEnd - bEnd
    }

    if (rankA === 1) {
      const aStart = getStartMs(a)
      const bStart = getStartMs(b)
      if (aStart !== bStart) return aStart - bStart
    }

    if (rankA === 2 || rankA === 3) {
      const aStart = getStartMs(a)
      const bStart = getStartMs(b)
      if (aStart !== bStart) return bStart - aStart
    }

    const byRoom = compareRoom(a, b)
    if (byRoom !== 0) return byRoom

    return Number(a.id ?? 0) - Number(b.id ?? 0)
  })

  return (
    <div className="card">
      <h2>
        {title}
        <span className="small">&nbsp;(Tap to view)</span>
      </h2>

      <div className="small reservation-list__hint">
        Viewing in {timeMode === "kyiv" ? "Kyiv time" : "your local time"}
      </div>

      {!list.length ? (
        <div className="small">No reservations.</div>
      ) : (
        list.map((r) => {
          const startDate = safeUtc(r.start_at)
          const endDate = safeUtc(r.end_at)
          const isCancelled = r.status === "cancelled"
          const isFinished = !isCancelled && !!endDate && endDate.getTime() <= nowUtcMs
          const isActive =
            !isCancelled && !!startDate && !!endDate &&
            startDate.getTime() <= nowUtcMs && endDate.getTime() > nowUtcMs
          const isOwn = !isCancelled && !isFinished
          const clickable = !!onOpenPast

          const status = isCancelled
            ? "cancelled"
            : isFinished
              ? "finished"
              : isActive
                ? "in progress"
                : "reserved"

          const mins = duration(r.start_at, r.end_at)
          const safeTitle = cutSingleLine(r.title || "Untitled reservation", 84)
          const timeLine = [
            safeFormatDateTime(r.start_at),
            endTime(r.end_at),
            mins !== null ? `${mins} min` : "",
          ]
            .filter(Boolean)
            .join(" · ")

          return (
            <div
              key={r.id}
              className={[
                "reservation",
                clickable ? "reservation--clickable" : "",
                isOwn ? "reservation--own" : "",
                isCancelled ? "reservation--cancelled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (clickable) onOpenPast?.(r)
              }}
            >
              <div
                className={[
                  "reservation__title",
                  isOwn ? "reservation__title--own" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={r.title || "Untitled reservation"}
              >
                {safeTitle}
              </div>

              <div
                className="reservation__meta"
                title={timeLine}
              >
                {timeLine}
              </div>

              <div
                className={[
                  "reservation__details",
                  "small",
                  isOwn ? "reservation__details--own" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={roomMetaLine(r, status)}
              >
                {roomMetaLine(r, status)}
              </div>

              {isOwn && (
                <div className="reservation__actions">
                  <button
                    className="secondary reservation__action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(r.id)
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="secondary reservation__action-btn reservation__action-btn--cancel"
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
