import type { Reservation } from "../hooks/useAppData"

type Props = {
  roomId: number
  reservations: Reservation[]
  selectedDate: string
  times: string[]
  timeMode: "kyiv" | "local"
}

const M = (v: string) =>
  Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5))

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

const parseUtc = (v: string) => new Date(`${String(v).replace(" ", "T")}Z`)

export default function Timeline({
  roomId,
  reservations,
  selectedDate,
  times,
  timeMode,
}: Props) {
  const zone =
    timeMode === "kyiv"
      ? "Europe/Kyiv"
      : Intl.DateTimeFormat().resolvedOptions().timeZone

  const fmt = (v: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: zone,
    }).format(parseUtc(v))

  const dateOf = (v: string) => toYmd(parseUtc(v), zone)

  const roomReservations = reservations.filter(
    (r) =>
      r.room_id === roomId &&
      r.status !== "cancelled" &&
      dateOf(r.start_at) === selectedDate
  )

  function slotClass(slot: string) {
    const slotMinutes = M(slot)

    for (const reservation of roomReservations) {
      const startMinutes = M(fmt(reservation.start_at))
      const endMinutes = M(fmt(reservation.end_at))

      if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
        return "tr"
      }
    }

    return "tf"
  }

  return (
    <div className="timeline">
      {times.map((slot) => (
        <div
          key={slot}
          className={`t ${slotClass(slot)}`}
          title={slot}
        />
      ))}
    </div>
  )
}
