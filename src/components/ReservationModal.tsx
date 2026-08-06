import type { Room, Reservation } from "../hooks/useAppData"

type Props = {
  show: boolean
  rooms: Room[]
  times: string[]
  reservations: Reservation[]
  selectedDate: string
  timeMode: "kyiv" | "local"
  title: string
  setTitle: (v: string) => void
  roomId: string
  setRoomId: (v: string) => void
  start: string
  setStart: (v: string) => void
  end: string
  setEnd: (v: string) => void
  onReserve: () => void
  onClose: () => void
  editing?: boolean
  error?: string
  loading?: boolean
}

const M = (v: string) =>
  Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5))

const isHm = (v: string) => /^\d{2}:\d{2}$/.test(v)

const parseUtc = (v: string) => new Date(`${String(v).replace(" ", "T")}Z`)

export default function ReservationModal({
  show,
  rooms,
  times,
  reservations,
  selectedDate,
  timeMode,
  title,
  setTitle,
  roomId,
  setRoomId,
  start,
  setStart,
  end,
  setEnd,
  onReserve,
  onClose,
  editing = false,
  error = "",
  loading = false,
}: Props) {
  if (!show) return null

  const zone =
    timeMode === "kyiv"
      ? "Europe/Kyiv"
      : Intl.DateTimeFormat().resolvedOptions().timeZone

  const floorText = (n: number) =>
    `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} floor`

  const fmt = (v: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: zone,
    }).format(parseUtc(v))

  const dateOf = (v: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(parseUtc(v))
      .reduce((acc, part) => {
        if (part.type !== "literal") acc[part.type] = part.value
        return acc
      }, {} as Record<string, string>)

  const roomReservations = reservations
    .filter((r) => {
      const d = dateOf(r.start_at)
      const ymd = `${d.year}-${d.month}-${d.day}`

      return (
        r.room_id === Number(roomId) &&
        r.status !== "cancelled" &&
        ymd === selectedDate
      )
    })
    .sort(
      (a, b) =>
        parseUtc(a.start_at).getTime() -
        parseUtc(b.start_at).getTime()
    )

  const selectedRoom = rooms.find((r) => String(r.id) === roomId)

  const startTimes = times.length > 1 ? times.slice(0, -1) : times

  const availableStartTimes =
    !roomId || !times.length
      ? startTimes
      : startTimes.filter((t) => {
          const m = M(t)

          return !roomReservations.some((r) => {
            const s = M(fmt(r.start_at))
            const e = M(fmt(r.end_at))
            return m >= s && m < e
          })
        })

  const safeStart =
    isHm(start) && availableStartTimes.includes(start)
      ? start
      : availableStartTimes[0] || ""

  const nextBusy =
    isHm(safeStart)
      ? roomReservations
          .map((r) => M(fmt(r.start_at)))
          .filter((v) => v > M(safeStart))
          .sort((a, b) => a - b)[0]
      : undefined

  const availableEndTimes =
    !isHm(safeStart)
      ? []
      : times.filter((t) => {
          if (!isHm(t)) return false

          const s = M(safeStart)
          const e = M(t)

          return e > s && (nextBusy === undefined || e <= nextBusy)
        })

  const safeEnd =
    isHm(end) && availableEndTimes.includes(end)
      ? end
      : availableEndTimes[0] || ""

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{editing ? "Edit Reservation" : "Reserve Meeting Room"}</h2>

        <div className="small">{selectedDate}</div>

        <div
          className="small"
          style={{ marginBottom: "10px" }}
        >
          Working in {timeMode === "kyiv" ? "Kyiv time" : "your local time"}
        </div>

        <label>Meeting title</label>

        <input
          placeholder="Enter meeting title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {!!error && <div className="error">{error}</div>}

        <label>Room</label>

        <select
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value)

            const nextRoomId = e.target.value

            if (!nextRoomId) return

            const nextRoomReservations = reservations
              .filter((r) => {
                const d = dateOf(r.start_at)
                const ymd = `${d.year}-${d.month}-${d.day}`

                return (
                  r.room_id === Number(nextRoomId) &&
                  r.status !== "cancelled" &&
                  ymd === selectedDate
                )
              })
              .sort(
                (a, b) =>
                  parseUtc(a.start_at).getTime() -
                  parseUtc(b.start_at).getTime()
              )

            const nextAvailableStarts = (times.length > 1 ? times.slice(0, -1) : times).filter(
              (t) => {
                const m = M(t)

                return !nextRoomReservations.some((r) => {
                  const s = M(fmt(r.start_at))
                  const e = M(fmt(r.end_at))
                  return m >= s && m < e
                })
              }
            )

            if (nextAvailableStarts.length) {
              const nextStart = nextAvailableStarts[0]
              setStart(nextStart)

              const nextNextBusy = nextRoomReservations
                .map((r) => M(fmt(r.start_at)))
                .filter((v) => v > M(nextStart))
                .sort((a, b) => a - b)[0]

              const nextAvailableEnds = times.filter((t) => {
                if (!isHm(t)) return false
                const s = M(nextStart)
                const e = M(t)
                return e > s && (nextNextBusy === undefined || e <= nextNextBusy)
              })

              if (nextAvailableEnds.length) {
                setEnd(nextAvailableEnds[0])
              }
            }
          }}
        >
          <option value="">Select room</option>

          {rooms.map((r) => (
            <option
              key={r.id}
              value={r.id}
            >
              {`${r.name} · ${floorText(r.floor)} · Capacity ${r.capacity}`}
            </option>
          ))}
        </select>

        {selectedRoom && (
          <div
            className="small"
            style={{ marginBottom: "12px" }}
          >
            {selectedRoom.description && (
              <>
                {selectedRoom.description}
                <br />
              </>
            )}

            {selectedRoom.area != null && (
              <>
                Area: {selectedRoom.area} m²
                <br />
              </>
            )}

            {!!selectedRoom.windows && (
              <>
                Windows: {selectedRoom.windows}
                <br />
              </>
            )}

            {!!selectedRoom.equipment && (
              <>
                Equipment: {selectedRoom.equipment}
                <br />
              </>
            )}

            {!!selectedRoom.features?.length && (
              <>Features: {selectedRoom.features.join(", ")}</>
            )}
          </div>
        )}

        <label>Start time</label>

        <select
          value={safeStart}
          onChange={(e) => {
            setStart(e.target.value)

            const nextStartValue = e.target.value
            const nextBusyValue = roomReservations
              .map((r) => M(fmt(r.start_at)))
              .filter((v) => v > M(nextStartValue))
              .sort((a, b) => a - b)[0]

            const nextEnds = times.filter((t) => {
              if (!isHm(t)) return false
              const s = M(nextStartValue)
              const ee = M(t)
              return ee > s && (nextBusyValue === undefined || ee <= nextBusyValue)
            })

            if (!nextEnds.includes(end)) {
              setEnd(nextEnds[0] || "")
            }
          }}
        >
          {availableStartTimes.length ? (
            availableStartTimes.map((t) => (
              <option
                key={t}
                value={t}
              >
                {t}
              </option>
            ))
          ) : (
            <option value="">No start slots</option>
          )}
        </select>

        <label>End time</label>

        <select
          value={safeEnd}
          onChange={(e) => setEnd(e.target.value)}
        >
          {availableEndTimes.length ? (
            availableEndTimes.map((t) => (
              <option
                key={t}
                value={t}
              >
                {t}
              </option>
            ))
          ) : (
            <option value="">No end slots</option>
          )}
        </select>

        <div className="modal-buttons">
          <button
            className="primary"
            disabled={
              loading ||
              !title.trim() ||
              !roomId ||
              !safeStart ||
              !safeEnd ||
              !availableEndTimes.length
            }
            onClick={onReserve}
          >
            {loading ? "Saving..." : editing ? "Save Changes" : "Reserve"}
          </button>

          <button
            className="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
