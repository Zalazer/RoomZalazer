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

  const dateOf = (v: string) => toYmd(parseUtc(v), zone)

  const fmt = (v: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: zone,
    }).format(parseUtc(v))

  const fmtDate = (date: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: zone,
    }).format(date)

  const roomReservations = reservations
    .filter(
      (r) =>
        r.room_id === room.id &&
        r.status !== "cancelled" &&
        dateOf(r.start_at) === selectedDate
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
    ? `Busy till ${fmtDate(new Date(busyUntilMs!))}`
    : nextUpcoming
    ? `Free till ${fmt(nextUpcoming.start_at)}`
    : officeEnd
    ? `Free till ${officeEnd}`
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
        {!active && timeMode === "kyiv" && officeEnd ? " · Kyiv time" : ""}
      </div>
    </div>
  )
}
