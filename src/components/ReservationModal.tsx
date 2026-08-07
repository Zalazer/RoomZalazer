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
  editingReservationId?: number | null
  error?: string
  loading?: boolean
  officeSettings?: any
  nowUtcMs?: number
}

const M = (v: string) =>
  Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5))

const isHm = (v: string) => /^\d{2}:\d{2}$/.test(v)
const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)

const isValidDate = (date: Date) => Number.isFinite(date.getTime())

const safeTimeZone = (value?: string) => {
  if (!value || typeof value !== "string") return "UTC"

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return value
  } catch {
    return "UTC"
  }
}

const getLocalTimeZone = () => {
  try {
    return safeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return "UTC"
  }
}

const parseUtc = (v: string) => {
  const raw = String(v || "")
  const normalized = raw.endsWith("Z")
    ? raw
    : `${raw.replace(" ", "T")}Z`

  const date = new Date(normalized)
  return isValidDate(date) ? date : null
}

const toYmd = (date: Date, zone: string) => {
  if (!isValidDate(date)) return ""

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTimeZone(zone),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date)

    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value || ""

    const y = get("year")
    const m = get("month")
    const d = get("day")

    return y && m && d ? `${y}-${m}-${d}` : ""
  } catch {
    return ""
  }
}

const toUtcFromDisplay = (date: string, time: string, zone: string) => {
  if (!isYmd(date) || !isHm(time)) return null

  const [y, m, d] = date.split("-").map(Number)
  const [h, min] = time.split(":").map(Number)

  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    !Number.isFinite(h) ||
    !Number.isFinite(min)
  ) {
    return null
  }

  try {
    const probeUtc = new Date(Date.UTC(y, m - 1, d, h, min))
    if (!isValidDate(probeUtc)) return null

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTimeZone(zone),
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

    const result = new Date(probeUtc.getTime() + diff)
    return isValidDate(result) ? result : null
  } catch {
    return null
  }
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
  editingReservationId = null,
  error = "",
  loading = false,
  officeSettings,
  nowUtcMs,
}: Props) {
  if (!show) return null

  const localZone = getLocalTimeZone()
  const zone = timeMode === "kyiv" ? "Europe/Kyiv" : localZone
  const currentUtcMs =
    typeof nowUtcMs === "number" && Number.isFinite(nowUtcMs)
      ? nowUtcMs
      : Date.now()

  const floorLabel = (n: number) => {
    if (n === 1) return "1st floor"
    if (n === 2) return "2nd floor"
    if (n === 3) return "3rd floor"
    return `${n}th floor`
  }

  const fmt = (v: string) => {
    const date = parseUtc(v)
    if (!date) return ""

    try {
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: safeTimeZone(zone),
      }).format(date)
    } catch {
      return ""
    }
  }

  const dateOfInZone = (v: string, targetZone: string) => {
    const date = parseUtc(v)
    if (!date) return ""
    return toYmd(date, targetZone)
  }

  const selectedRoom = rooms.find((r) => String(r.id) === roomId)

  const officeDate =
    timeMode === "kyiv"
      ? (isYmd(selectedDate) ? selectedDate : "")
      : (() => {
          const localMiddayUtc = toUtcFromDisplay(selectedDate, "12:00", localZone)
          return localMiddayUtc ? toYmd(localMiddayUtc, "Europe/Kyiv") : ""
        })()

  const todayInKyiv = toYmd(new Date(currentUtcMs), "Europe/Kyiv")
  const officeEnd = isHm(officeSettings?.working_day_end ?? "")
    ? officeSettings.working_day_end
    : ""

  const officeEndUtcMs =
    officeDate && officeEnd
      ? toUtcFromDisplay(officeDate, officeEnd, "Europe/Kyiv")?.getTime() ?? null
      : null

  const isEndedDay =
    !!officeDate &&
    !!todayInKyiv &&
    (
      officeDate < todayInKyiv ||
      (officeDate === todayInKyiv &&
        officeEndUtcMs != null &&
        currentUtcMs >= officeEndUtcMs)
    )

  const getRoomReservations = (targetRoomId: string) =>
    reservations
      .filter((r) => {
        const reservationOfficeDate = dateOfInZone(r.start_at, "Europe/Kyiv")
        const isSameReservation =
          editing &&
          editingReservationId != null &&
          Number(r.id) === Number(editingReservationId)

        return (
          r.room_id === Number(targetRoomId) &&
          r.status !== "cancelled" &&
          !!reservationOfficeDate &&
          !!officeDate &&
          reservationOfficeDate === officeDate &&
          !isSameReservation
        )
      })
      .sort((a, b) => {
        const ta = parseUtc(a.start_at)?.getTime() ?? 0
        const tb = parseUtc(b.start_at)?.getTime() ?? 0
        return ta - tb
      })

  const getNextBusyStart = (
    roomReservations: Reservation[],
    startValue: string
  ) =>
    roomReservations
      .map((r) => M(fmt(r.start_at)))
      .filter((v) => Number.isFinite(v) && v > M(startValue))
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
        const startFmt = fmt(r.start_at)
        const endFmt = fmt(r.end_at)

        if (!isHm(startFmt) || !isHm(endFmt)) return false

        const s = M(startFmt)
        const e = M(endFmt)
        return m >= s && m < e
      })

      if (occupied) return false

      return getAvailableEndTimes(roomReservations, t).length > 0
    })

  const roomReservations = roomId ? getRoomReservations(roomId) : []

  const availableStartTimes =
    isEndedDay
      ? []
      : !roomId || !times.length
        ? times.filter(isHm)
        : getAvailableStartTimes(roomReservations)

  const safeStart =
    isHm(start) && availableStartTimes.includes(start)
      ? start
      : availableStartTimes[0] || ""

  const availableEndTimes =
    isEndedDay || !roomId || !isHm(safeStart)
      ? []
      : getAvailableEndTimes(roomReservations, safeStart)

  const safeEnd =
    isHm(end) && availableEndTimes.includes(end)
      ? end
      : availableEndTimes[0] || ""

  const selectedDateProbe = toUtcFromDisplay(selectedDate, "12:00", zone)
  const selectedDateLabel = selectedDateProbe
    ? (() => {
        try {
          return new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: safeTimeZone(zone),
          }).format(selectedDateProbe)
        } catch {
          return selectedDate
        }
      })()
    : selectedDate

  const viewingLabel = `${selectedDateLabel}, ${timeMode === "kyiv" ? "Kyiv time" : "Local time"}`

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

        {isEndedDay && (
          <div
            className="small ended"
            style={{ marginBottom: "12px", fontWeight: 600, padding: "8px 10px", borderRadius: "12px" }}
          >
            This working day has ended.
          </div>
        )}

        <label>Meeting title</label>
        <input
          placeholder="Enter meeting title..."
          value={title}
          disabled={loading || isEndedDay}
          onChange={(e) => setTitle(e.target.value)}
        />

        {!!error && <div className="error">{error}</div>}

        <label>Room</label>
        <select
          value={roomId}
          disabled={loading || isEndedDay}
          onChange={(e) => {
            const nextRoomId = e.target.value
            setRoomId(nextRoomId)

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
          disabled={loading || isEndedDay || !availableStartTimes.length}
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
            <option value="">
              {isEndedDay ? "This working day has ended" : "No start slots"}
            </option>
          )}
        </select>

        <label>End time</label>
        <select
          value={safeEnd}
          disabled={loading || isEndedDay || !availableEndTimes.length}
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
            <option value="">
              {isEndedDay ? "This working day has ended" : "No end slots"}
            </option>
          )}
        </select>

        <div className="modal-buttons">
          <button
            className="primary"
            disabled={
              loading ||
              isEndedDay ||
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
