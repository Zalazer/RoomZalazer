import type { Reservation } from "../hooks/useAppData"

type Props = {
  roomId: number
  reservations: Reservation[]
  selectedDate: string
  times: string[]
  timeMode: "kyiv" | "local"
  myReservationIds?: Set<number>
}

function toYmd(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value || ""
  return `${get("year")}-${get("month")}-${get("day")}`
}

const parseUtc = (v: string) => {
  const raw = String(v)
  return new Date(raw.endsWith("Z") ? raw : `${raw.replace(" ", "T")}Z`)
}

function toUtcFromZone(date: string, time: string, zone: string) {
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

export default function Timeline({
  roomId,
  reservations,
  selectedDate,
  times,
  timeMode,
  myReservationIds,
}: Props) {
  const zone =
    timeMode === "kyiv"
      ? "Europe/Kyiv"
      : Intl.DateTimeFormat().resolvedOptions().timeZone

  const dateOf = (v: string) => toYmd(parseUtc(v), zone)

  const roomReservations = reservations.filter(
    (r) =>
      r.room_id === roomId &&
      r.status !== "cancelled" &&
      dateOf(r.start_at) === selectedDate
  )

  const visibleTimes = times.length > 1 ? times.slice(0, -1) : times

  const isOwnReservation = (reservation: Reservation) => {
    return myReservationIds?.has(reservation.id) ?? false
  }

  const slotClass = (slot: string) => {
    const slotUtcMs = toUtcFromZone(selectedDate, slot, zone).getTime()

    for (const reservation of roomReservations) {
      const startMs = parseUtc(reservation.start_at).getTime()
      const endMs = parseUtc(reservation.end_at).getTime()

      if (slotUtcMs >= startMs && slotUtcMs < endMs) {
        return isOwnReservation(reservation) ? "to t--own" : "tr"
      }
    }

    return "tf"
  }

  return (
    <div className="timeline">
      {visibleTimes.map((slot) => (
        <div
          key={slot}
          className={`t ${slotClass(slot)}`}
          title={slot}
        />
      ))}
    </div>
  )
}
