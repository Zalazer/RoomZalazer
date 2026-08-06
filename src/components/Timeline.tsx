import type { Reservation } from "../hooks/useAppData"

type Props = {
  roomId: number
  reservations: Reservation[]
  selectedDate: string
  times: string[]
  timeMode: "kyiv" | "local"
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

  const dateOf = (v: string) => toYmd(parseUtc(v), zone)

  const roomReservations = reservations.filter(
    (r) =>
      r.room_id === roomId &&
      r.status !== "cancelled" &&
      dateOf(r.start_at) === selectedDate
  )

  const visibleTimes = times.length > 1 ? times.slice(0, -1) : times

  function slotClass(slot: string) {
    const slotUtcMs = roomReservations.length
      ? roomReservations
          .map((r) => {
            const start = parseUtc(r.start_at)
            const localDate = new Intl.DateTimeFormat("en-CA", {
              timeZone: zone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
              .formatToParts(start)
              .reduce((acc, part) => {
                if (part.type !== "literal") acc[part.type] = part.value
                return acc
              }, {} as Record<string, string>)

            const ymd = `${localDate.year}-${localDate.month}-${localDate.day}`
            const [hour, minute] = slot.split(":").map(Number)

            const probeUtc = new Date(Date.UTC(
              Number(ymd.slice(0, 4)),
              Number(ymd.slice(5, 7)) - 1,
              Number(ymd.slice(8, 10)),
              hour,
              minute,
              0
            ))

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

            const desired = Date.UTC(
              Number(ymd.slice(0, 4)),
              Number(ymd.slice(5, 7)) - 1,
              Number(ymd.slice(8, 10)),
              hour,
              minute
            )

            const seen = Date.UTC(seenY, seenM - 1, seenD, seenH, seenMin)
            const diff = desired - seen

            return probeUtc.getTime() + diff
          })[0]
      : null

    if (slotUtcMs === null) return "tf"

    for (const reservation of roomReservations) {
      const startMs = parseUtc(reservation.start_at).getTime()
      const endMs = parseUtc(reservation.end_at).getTime()

      if (slotUtcMs >= startMs && slotUtcMs < endMs) {
        return "tr"
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
