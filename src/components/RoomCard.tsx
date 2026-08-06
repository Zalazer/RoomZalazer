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

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || "0")

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

const getOfficeDateForSelectedDate = (selectedDate: string, timeMode: "kyiv" | "local") => {
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

  const nextUpcoming = roomReservations.find(
    (r) => parseUtc(r.start_at).getTime() > nowUtcMs
  )

  const statusText = active
    ? `Busy till ${formatStatusTime(new Date(busyUntilMs!))}`
    : nextUpcoming
    ? `Free till ${formatStatusTime(nextUpcoming.start_at)}`
    : officeEnd
    ? `Free till ${formatOfficeEnd(officeDate, officeEnd)}`
    : "Available"

  return (
    <div
      className="room-card"
      onClick={onClick}
    >
      <div className="room-head">
        <div className="room-name">
          {room.name}
          {" · "}
          {floorLabel(room.floor)}
          {" · Capacity "}
          {room.capacity}
          {room.area != null && ` · ${room.area} m²`}
          {room.windows && ` · ${room.windows}`}
        </div>
      </div>

      <Timeline
        roomId={room.id}
        reservations={reservations}
        selectedDate={selectedDate}
        timeMode={timeMode}
        times={times}
      />

      {room.description && <div className="desc">{room.description}</div>}

      {!!room.features?.length && (
        <div className="small">{room.features.join(" • ")}</div>
      )}

      {room.equipment && (
        <div className="small">Equipment: {room.equipment}</div>
      )}

      <div
        className={`small ${active ? "reserved" : "available"}`}
        style={{
          fontWeight: 600,
          color: active ? "#ffc0c0" : "#97ffbd",
        }}
      >
        {statusText}
      </div>
    </div>
  )
}
