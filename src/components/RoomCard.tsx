import Timeline from "./Timeline"
import type { Room, Reservation } from "../hooks/useAppData"

type Props = {
  room: Room
  reservations: Reservation[]
  selectedDate: string
  timeMode: "kyiv" | "local"
  times: string[]
  officeSettings: any
  nowUtcMs: number
  onClick: () => void
  userId?: number | null
}

const toYmd = (date: Date, zone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value || ""

  return `${get("year")}-${get("month")}-${get("day")}`
}

const parseUtc = (v: string) => new Date(`${String(v).replace(" ", "T")}Z`)

const toUtcFromZone = (date: string, time: string, zone: string) => {
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

const getOfficeDateForSelectedDate = (
  selectedDate: string,
  timeMode: "kyiv" | "local"
) => {
  if (timeMode === "kyiv") return selectedDate

  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const localMiddayUtc = toUtcFromZone(selectedDate, "12:00", localZone)

  return toYmd(localMiddayUtc, "Europe/Kyiv")
}

export default function RoomCard({
  room,
  reservations,
  selectedDate,
  timeMode,
  times,
  officeSettings,
  nowUtcMs,
  onClick,
  userId = null,
}: Props) {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const officeDate = getOfficeDateForSelectedDate(selectedDate, timeMode)

  const floorLabel = (n: number) => {
    if (n === 1) return "1st floor"
    if (n === 2) return "2nd floor"
    if (n === 3) return "3rd floor"
    return `${n}th floor`
  }

  const dateOf = (v: string, targetZone: string) => toYmd(parseUtc(v), targetZone)

  const fmtDateInZone = (date: Date, targetZone: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: targetZone,
    }).format(date)

  const formatStatusTime = (utcValue: string | Date) => {
    const date = utcValue instanceof Date ? utcValue : parseUtc(utcValue)

    const localText = fmtDateInZone(date, localZone)
    const kyivText = fmtDateInZone(date, "Europe/Kyiv")

    if (timeMode === "kyiv") return kyivText
    return `${localText} (${kyivText} Kyiv)`
  }

  const formatOfficeEnd = (officeDay: string, officeEndHm: string) => {
    const endUtc = toUtcFromZone(officeDay, officeEndHm, "Europe/Kyiv")
    const localText = fmtDateInZone(endUtc, localZone)

    if (timeMode === "kyiv") return officeEndHm
    return `${localText} (${officeEndHm} Kyiv)`
  }

  const roomReservations = reservations
    .filter(
      (r) =>
        r.room_id === room.id &&
        r.status !== "cancelled" &&
        dateOf(r.start_at, "Europe/Kyiv") === officeDate
    )
    .sort(
      (a, b) =>
        parseUtc(a.start_at).getTime() - parseUtc(b.start_at).getTime()
    )

  const active = roomReservations.find((r) => {
    const s = parseUtc(r.start_at).getTime()
    const e = parseUtc(r.end_at).getTime()
    return nowUtcMs >= s && nowUtcMs < e
  })

  let busyUntilMs: number | null = null

  if (active) {
    const activeStartMs = parseUtc(active.start_at).getTime()
    busyUntilMs = parseUtc(active.end_at).getTime()

    for (const reservation of roomReservations) {
      const startMs = parseUtc(reservation.start_at).getTime()
      const endMs = parseUtc(reservation.end_at).getTime()

      if (startMs < activeStartMs) continue

      if (startMs <= busyUntilMs) {
        busyUntilMs = Math.max(busyUntilMs, endMs)
      }
    }
  }

  const officeEnd = officeSettings?.working_day_end ?? ""
  const officeStart = officeSettings?.working_day_start ?? ""
  const todayInKyiv = toYmd(new Date(nowUtcMs), "Europe/Kyiv")

  const officeEndUtcMs =
    officeEnd ? toUtcFromZone(officeDate, officeEnd, "Europe/Kyiv").getTime() : null

  const isPastDay = officeDate < todayInKyiv
  const isToday = officeDate === todayInKyiv

  const futureBookableStarts = times
    .filter((time) => {
      if (!officeStart || !officeEnd) return true
      return time >= officeStart && time < officeEnd
    })
    .map((time) => toUtcFromZone(officeDate, time, "Europe/Kyiv").getTime())
    .filter((startMs) => startMs > nowUtcMs)

  const hasFutureBookableSlot = futureBookableStarts.length > 0

  const nextUpcoming = roomReservations.find((r) => {
    const startMs = parseUtc(r.start_at).getTime()
    return startMs > nowUtcMs
  })

  const isBookingClosedForToday =
    !active &&
    isToday &&
    !hasFutureBookableSlot

  const isEndedDay =
    isPastDay ||
    (!!officeEndUtcMs && officeDate === todayInKyiv && nowUtcMs >= officeEndUtcMs)

  const statusText = active
    ? `Busy till ${formatStatusTime(new Date(busyUntilMs!))}`
    : isBookingClosedForToday
      ? officeEnd
        ? `Free till ${formatOfficeEnd(officeDate, officeEnd)} · booking closed`
        : "Booking closed"
      : isPastDay
        ? "This working day has ended."
        : nextUpcoming
          ? `Free till ${formatStatusTime(nextUpcoming.start_at)}`
          : officeEnd
            ? `Free till ${formatOfficeEnd(officeDate, officeEnd)}`
            : "Available"

  const statusClass =
    active
      ? "reserved"
      : isBookingClosedForToday || isEndedDay
        ? "ended"
        : "available"

  const windowsValue =
    room.windows != null ? String(room.windows).trim() : ""

  const metaParts = [
    floorLabel(room.floor),
    `${room.capacity} seats`,
    typeof room.area === "number" && room.area > 0 ? `${room.area} m²` : null,
    windowsValue && windowsValue !== "0" ? `Windows: ${windowsValue}` : null,
  ].filter(Boolean)

  return (
    <div
      className="room-card"
      onClick={onClick}
    >
      <div className="room-head">
        <div className="room-name">
          <div
            className="room-title"
            title={room.name}
          >
            {room.name}
          </div>

          <div
            className="room-meta-line"
            title={metaParts.join(" · ")}
          >
            {metaParts.join(" · ")}
          </div>
        </div>
      </div>

      <Timeline
        roomId={room.id}
        reservations={reservations}
        selectedDate={selectedDate}
        timeMode={timeMode}
        times={times}
        userId={userId}
      />

      {room.description && <div className="desc">{room.description}</div>}

      {!!room.features?.length && (
        <div className="small">{room.features.join(" • ")}</div>
      )}

      {room.equipment && (
        <div className="small">Equipment: {room.equipment}</div>
      )}

      <div
        className={`small ${statusClass}`}
        style={{ fontWeight: 600 }}
      >
        {statusText}
      </div>
    </div>
  )
}
