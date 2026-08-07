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

const toUtcFromDisplay = (date: string, time: string, zone: string) => {
  const [y, m, d] = date.split("-").map(Number)
  const [h, min] = time.split(":").map(Number)

  const probeUtc = new Date(Date.UTC(y, m - 1, d, h, min))

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(probeUtc)

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value || "0")

  const seenY = get("year")
  const seenM = get("month")
  const seenD = get("day")
  const seenH = get("hour")
  const seenMin = get("minute")

  const desired = Date.UTC(y, m - 1, d, h, min)
  const seen = Date.UTC(seenY, seenM - 1, seenD, seenH, seenMin)
  const diff = desired - seen

  return new Date(probeUtc.getTime() + diff)
}

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

  const floorLabel = (n: number) => {
    if (n === 1) return "1st floor"
    if (n === 2) return "2nd floor"
    if (n === 3) return "3rd floor"
    return `${n}th floor`
  }

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

  const selectedRoom = rooms.find((r) => String(r.id) === roomId)

  const getRoomReservations = (targetRoomId: string) =>
    reservations
      .filter((r) => {
        const d = dateOf(r.start_at)
        const ymd = `${d.year}-${d.month}-${d.day}`

        return (
          r.room_id === Number(targetRoomId) &&
          r.status !== "cancelled" &&
          ymd === selectedDate
        )
      })
      .sort(
        (a, b) =>
          parseUtc(a.start_at).getTime() -
          parseUtc(b.start_at).getTime()
      )

  const getNextBusyStart = (
    roomReservations: Reservation[],
    startValue: string
  ) =>
    roomReservations
      .map((r) => M(fmt(r.start_at)))
      .filter((v) => v > M(startValue))
      .sort((a, b) => a - b)[0]

  const getAvailableEndTimes = (
    roomReservations: Reservation[],
    startValue: string
  ) => {
    if (!isHm(startValue)) return []

    const nextBusyValue = getNextBusyStart(roomReservations, startValue)

    return times.filter((t) => {
      if (!isHm(t)) return false

      const s = M(startValue)
      const e = M(t)

      return e > s && (nextBusyValue === undefined || e <= nextBusyValue)
    })
  }

  const getAvailableStartTimes = (roomReservations: Reservation[]) =>
    times.filter((t) => {
      if (!isHm(t)) return false

      const m = M(t)

      const occupied = roomReservations.some((r) => {
        const s = M(fmt(r.start_at))
        const e = M(fmt(r.end_at))
        return m >= s && m < e
      })

      if (occupied) return false

      return getAvailableEndTimes(roomReservations, t).length > 0
    })

  const roomReservations = roomId ? getRoomReservations(roomId) : []

  const availableStartTimes =
    !roomId || !times.length
      ? times.filter(isHm)
      : getAvailableStartTimes(roomReservations)

  const safeStart =
    isHm(start) && availableStartTimes.includes(start)
      ? start
      : availableStartTimes[0] || ""

  const availableEndTimes =
    !roomId || !isHm(safeStart)
      ? []
      : getAvailableEndTimes(roomReservations, safeStart)

  const safeEnd =
    isHm(end) && availableEndTimes.includes(end)
      ? end
      : availableEndTimes[0] || ""

  const selectedDateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: zone,
  }).format(toUtcFromDisplay(selectedDate, "12:00", zone))

  const viewingLabel =
    `${selectedDateLabel}, ${timeMode === "kyiv" ? "Kyiv time" : "Local time"}`

  const windowsValue =
    selectedRoom?.windows != null ? String(selectedRoom.windows).trim() : ""

  const metaParts = selectedRoom
    ? [
        floorLabel(selectedRoom.floor),
        `${selectedRoom.capacity} seats`,
        typeof selectedRoom.area === "number" && selectedRoom.area > 0
          ? `${selectedRoom.area} m²`
          : null,
        windowsValue && windowsValue !== "0"
          ? `Windows: ${windowsValue}`
          : null,
      ].filter(Boolean)
    : ["Select a room to see room details"]

  return (
    <div className="modal">
      <div className="modal-content">
        <div
          className="room-name"
          style={{ marginBottom: "10px" }}
        >
          <div
            className="room-title"
            title={selectedRoom ? selectedRoom.name : editing ? "Edit reservation" : "New reservation"}
          >
            {selectedRoom ? selectedRoom.name : editing ? "Edit reservation" : "New reservation"}
          </div>

          <div
            className="room-meta-line"
            title={metaParts.join(" · ")}
          >
            {metaParts.join(" · ")}
          </div>
        </div>

        <div
          className="small"
          style={{ marginBottom: "12px" }}
        >
          {viewingLabel}
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

            if (!nextRoomId) {
              setStart("")
              setEnd("")
              return
            }

            const nextRoomReservations = getRoomReservations(nextRoomId)
            const nextAvailableStarts = getAvailableStartTimes(nextRoomReservations)

            if (nextAvailableStarts.length) {
              const nextStart = nextAvailableStarts[0]
              setStart(nextStart)

              const nextAvailableEnds = getAvailableEndTimes(
                nextRoomReservations,
                nextStart
              )

              setEnd(nextAvailableEnds[0] || "")
            } else {
              setStart("")
              setEnd("")
            }
          }}
        >
          <option value="">Select room</option>

          {rooms.map((r) => (
            <option
              key={r.id}
              value={r.id}
            >
              {`${r.name} · ${floorLabel(r.floor)} · ${r.capacity} seats`}
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
            const nextStartValue = e.target.value
            setStart(nextStartValue)

            const nextEnds = getAvailableEndTimes(roomReservations, nextStartValue)

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
