import { useState } from "react"
import Timeline from "./Timeline"
import RoomWeekGridModal from "./RoomWeekGridModal"
import {
  getEffectiveWorkingHours,
  type Room,
  type Reservation,
  type OfficeCalendarDay,
  type OfficeSettings,
} from "../hooks/useAppData"

type Props = {
  room: Room
  reservations: Reservation[]
  selectedDate: string
  timeMode: "kyiv" | "local"
  times: string[]
  officeSettings: OfficeSettings | null
  officeCalendar: OfficeCalendarDay[]
  nowUtcMs: number
  onClick: () => void
  myReservationIds?: Set<number>
}

const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)

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

const parseUtc = (v: string) => {
  const raw = String(v || "").trim()
  const normalized = raw.endsWith("Z") ? raw : `${raw.replace(" ", "T")}Z`
  return new Date(normalized)
}

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
  if (!isYmd(selectedDate)) return selectedDate
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
  officeCalendar,
  nowUtcMs,
  onClick,
  myReservationIds,
}: Props) {
  const [showWeekGrid, setShowWeekGrid] = useState(false)

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

  const dayMeta = getEffectiveWorkingHours(
    officeDate,
    officeSettings,
    officeCalendar
  )

  const todayInKyiv = toYmd(new Date(nowUtcMs), "Europe/Kyiv")

  const officeStartUtcMs =
    dayMeta.start
      ? toUtcFromZone(officeDate, dayMeta.start, "Europe/Kyiv").getTime()
      : null

  const officeEndUtcMs =
    dayMeta.end
      ? toUtcFromZone(officeDate, dayMeta.end, "Europe/Kyiv").getTime()
      : null

  const isPastDay = officeDate < todayInKyiv
  const isToday = officeDate === todayInKyiv
  const viewZone = timeMode === "kyiv" ? "Europe/Kyiv" : localZone

  const futureBookableStarts = dayMeta.closed
    ? []
    : times
        .map((time) => {
          const slotUtc = toUtcFromZone(selectedDate, time, viewZone).getTime()
          return { time, slotUtc }
        })
        .filter(({ slotUtc }) => {
          if (!dayMeta.start || !dayMeta.end) return false

          const officeStartUtc = toUtcFromZone(
            officeDate,
            dayMeta.start,
            "Europe/Kyiv"
          ).getTime()

          const officeEndUtc = toUtcFromZone(
            officeDate,
            dayMeta.end,
            "Europe/Kyiv"
          ).getTime()

          return slotUtc >= officeStartUtc && slotUtc < officeEndUtc && slotUtc > nowUtcMs
        })

  const hasFutureBookableSlot = futureBookableStarts.length > 0

  const nextUpcoming = roomReservations.find((r) => {
    const startMs = parseUtc(r.start_at).getTime()
    return startMs > nowUtcMs
  })

  let firstFreeAfterBusyStartMs: number | null = null

  if (
    !dayMeta.closed &&
    officeStartUtcMs != null &&
    officeEndUtcMs != null &&
    officeStartUtcMs < officeEndUtcMs &&
    officeDate >= todayInKyiv
  ) {
    const firstCovering = roomReservations.find((reservation) => {
      const startMs = parseUtc(reservation.start_at).getTime()
      const endMs = parseUtc(reservation.end_at).getTime()
      return officeStartUtcMs >= startMs && officeStartUtcMs < endMs
    })

    if (firstCovering) {
      let cursorMs = parseUtc(firstCovering.end_at).getTime()

      for (const reservation of roomReservations) {
        const startMs = parseUtc(reservation.start_at).getTime()
        const endMs = parseUtc(reservation.end_at).getTime()

        if (endMs <= officeStartUtcMs) continue
        if (startMs > cursorMs) continue

        if (startMs <= cursorMs) {
          cursorMs = Math.max(cursorMs, endMs)
        }
      }

      if (cursorMs < officeEndUtcMs) {
        firstFreeAfterBusyStartMs = cursorMs
      }
    }
  }

  const isBookingClosedForToday =
    !dayMeta.closed &&
    !active &&
    isToday &&
    !hasFutureBookableSlot

  const isEndedDay =
    isPastDay ||
    (!dayMeta.closed &&
      !!officeEndUtcMs &&
      officeDate === todayInKyiv &&
      nowUtcMs >= officeEndUtcMs)

  const statusText = dayMeta.closed
    ? dayMeta.title
      ? `Closed for this day · ${dayMeta.title}`
      : "Closed for this day"
    : active
      ? `Busy till ${formatStatusTime(new Date(busyUntilMs!))}`
      : isBookingClosedForToday
        ? "Booking closed for today"
        : isEndedDay
          ? "This working day has ended."
          : firstFreeAfterBusyStartMs != null
            ? `Free from ${formatStatusTime(new Date(firstFreeAfterBusyStartMs))}`
            : nextUpcoming
              ? `Free till ${formatStatusTime(nextUpcoming.start_at)}`
              : dayMeta.end
                ? `Free till ${formatOfficeEnd(officeDate, dayMeta.end)}`
                : "Available"

  const statusClass =
    active
      ? "reserved"
      : dayMeta.closed || isBookingClosedForToday || isEndedDay
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
    <>
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

          <button
            type="button"
            className="secondary header-btn"
            onClick={(e) => {
              e.stopPropagation()
              setShowWeekGrid(true)
            }}
          >
            Week grid
          </button>
        </div>

        <Timeline
          roomId={room.id}
          reservations={reservations}
          selectedDate={selectedDate}
          timeMode={timeMode}
          times={times}
          myReservationIds={myReservationIds}
          officeSettings={officeSettings}
          officeCalendar={officeCalendar}
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

      <RoomWeekGridModal
        show={showWeekGrid}
        room={room}
        reservations={reservations}
        selectedDate={selectedDate}
        timeMode={timeMode}
        times={times}
        officeSettings={officeSettings}
        officeCalendar={officeCalendar}
        myReservationIds={myReservationIds}
        onClose={() => setShowWeekGrid(false)}
      />
    </>
  )
}
