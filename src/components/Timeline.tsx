import type {
  Reservation,
  OfficeSettings,
  OfficeCalendarDay,
} from "../hooks/useAppData"
import { getEffectiveWorkingHours } from "../hooks/useAppData"

type Props = {
  roomId: number
  reservations: Reservation[]
  selectedDate: string
  times: string[]
  timeMode: "kyiv" | "local"
  myReservationIds?: Set<number>
  officeSettings: OfficeSettings | null
  officeCalendar: OfficeCalendarDay[]
}

const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)
const isHm = (v: string) => /^\d{2}:\d{2}$/.test(v)

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
  const raw = String(v || "").trim()
  const normalized = raw.endsWith("Z") ? raw : `${raw.replace(" ", "T")}Z`
  return new Date(normalized)
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

function getOfficeDateForSelectedDate(
  selectedDate: string,
  timeMode: "kyiv" | "local",
  localZone: string
) {
  if (!isYmd(selectedDate)) return selectedDate
  if (timeMode === "kyiv") return selectedDate

  const localMiddayUtc = toUtcFromZone(selectedDate, "12:00", localZone)
  return toYmd(localMiddayUtc, "Europe/Kyiv")
}

export default function Timeline({
  roomId,
  reservations,
  selectedDate,
  times,
  timeMode,
  myReservationIds,
  officeSettings,
  officeCalendar,
}: Props) {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const viewZone = timeMode === "kyiv" ? "Europe/Kyiv" : localZone
  const officeDate = getOfficeDateForSelectedDate(selectedDate, timeMode, localZone)

  const dateOfInOfficeZone = (v: string) => toYmd(parseUtc(v), "Europe/Kyiv")

  const roomReservations = reservations.filter(
    (r) =>
      r.room_id === roomId &&
      r.status !== "cancelled" &&
      dateOfInOfficeZone(r.start_at) === officeDate
  )

  const visibleTimes = times.length > 1 ? times.slice(0, -1) : times

  const dayMeta = getEffectiveWorkingHours(
    officeDate,
    officeSettings,
    officeCalendar
  )

  const isOwnReservation = (reservation: Reservation) =>
    myReservationIds?.has(reservation.id) ?? false

  const workStartUtcMs =
    !dayMeta.closed && isHm(dayMeta.start)
      ? toUtcFromZone(officeDate, dayMeta.start, "Europe/Kyiv").getTime()
      : null

  const workEndUtcMs =
    !dayMeta.closed && isHm(dayMeta.end)
      ? toUtcFromZone(officeDate, dayMeta.end, "Europe/Kyiv").getTime()
      : null

  const getSlotUtcMs = (slot: string) => {
    if (!isHm(slot) || !isYmd(selectedDate)) return null
    return toUtcFromZone(selectedDate, slot, viewZone).getTime()
  }

  const slotInfo = visibleTimes.map((slot) => {
    const slotUtcMs = getSlotUtcMs(slot)

    const withinWorkingRange =
      slotUtcMs != null &&
      !dayMeta.closed &&
      workStartUtcMs != null &&
      workEndUtcMs != null &&
      slotUtcMs >= workStartUtcMs &&
      slotUtcMs < workEndUtcMs

    let className = "tx"

    if (withinWorkingRange && slotUtcMs != null) {
      const matchedReservation = roomReservations.find((reservation) => {
        const startMs = parseUtc(reservation.start_at).getTime()
        const endMs = parseUtc(reservation.end_at).getTime()
        return slotUtcMs >= startMs && slotUtcMs < endMs
      })

      if (matchedReservation) {
        className = isOwnReservation(matchedReservation) ? "to t--own" : "tr"
      } else {
        className = "tf"
      }
    }

    const title = dayMeta.closed
      ? dayMeta.title || "Closed"
      : !withinWorkingRange
        ? "Outside working hours"
        : slot

    return {
      slot,
      className,
      title,
    }
  })

  return (
    <div className="timeline">
      {slotInfo.map(({ slot, className, title }) => (
        <div
          key={slot}
          className={`t ${className}`}
          title={title}
        />
      ))}
    </div>
  )
}
