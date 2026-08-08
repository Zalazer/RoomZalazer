import type {
  Room,
  Reservation,
  OfficeCalendarDay,
  OfficeSettings,
} from "../hooks/useAppData"
import { getEffectiveWorkingHours } from "../hooks/useAppData"

type Props = {
  show: boolean
  room: Room
  reservations: Reservation[]
  selectedDate: string
  timeMode: "kyiv" | "local"
  times: string[]
  officeSettings: OfficeSettings | null
  officeCalendar: OfficeCalendarDay[]
  myReservationIds?: Set<number>
  onClose: () => void
}

const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)
const isHm = (v: string) => /^\d{2}:\d{2}$/.test(v)

const parseUtc = (v: string) => {
  const raw = String(v || "").trim()
  const normalized = raw.endsWith("Z") ? raw : `${raw.replace(" ", "T")}Z`
  return new Date(normalized)
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

const addDaysUtc = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return toYmd(date, "UTC")
}

const startOfWeekMonday = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDaysUtc(ymd, diff)
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
  timeMode: "kyiv" | "local",
  localZone: string
) => {
  if (!isYmd(selectedDate)) return selectedDate
  if (timeMode === "kyiv") return selectedDate

  const localMiddayUtc = toUtcFromZone(selectedDate, "12:00", localZone)
  return toYmd(localMiddayUtc, "Europe/Kyiv")
}

const floorLabel = (n: number) => {
  if (n === 1) return "1st floor"
  if (n === 2) return "2nd floor"
  if (n === 3) return "3rd floor"
  return `${n}th floor`
}

export default function RoomWeekGridModal({
  show,
  room,
  reservations,
  selectedDate,
  timeMode,
  times,
  officeSettings,
  officeCalendar,
  myReservationIds,
  onClose,
}: Props) {
  if (!show) return null

  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const viewZone = timeMode === "kyiv" ? "Europe/Kyiv" : localZone

  const officeSelectedDate = getOfficeDateForSelectedDate(
    selectedDate,
    timeMode,
    localZone
  )

  const weekStartOfficeDate = startOfWeekMonday(officeSelectedDate)
  const weekOfficeDates = Array.from({ length: 7 }, (_, i) =>
    addDaysUtc(weekStartOfficeDate, i)
  )

  const visibleTimes = times.length > 1 ? times.slice(0, -1) : times

  const getDisplayDateForOfficeDay = (officeDay: string) => {
    if (timeMode === "kyiv") return officeDay
    const middayUtc = toUtcFromZone(officeDay, "12:00", "Europe/Kyiv")
    return toYmd(middayUtc, viewZone)
  }

  const selectedDisplayDate =
    timeMode === "kyiv"
      ? officeSelectedDate
      : getDisplayDateForOfficeDay(officeSelectedDate)

  const dayHeaders = weekOfficeDates.map((officeDay) => {
    const noonUtc = toUtcFromZone(officeDay, "12:00", "Europe/Kyiv")
    const displayDate = getDisplayDateForOfficeDay(officeDay)

    const weekday = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      timeZone: viewZone,
    }).format(noonUtc)

    const day = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      timeZone: viewZone,
    }).format(noonUtc)

    return {
      officeDay,
      displayDate,
      weekday,
      day,
      isSelected: displayDate === selectedDisplayDate,
      meta: getEffectiveWorkingHours(officeDay, officeSettings, officeCalendar),
    }
  })

  const roomReservations = reservations.filter(
    (r) => r.room_id === room.id && r.status !== "cancelled"
  )

  const getSlotUtcMs = (viewDate: string, slot: string) => {
    if (!isYmd(viewDate) || !isHm(slot)) return null
    return toUtcFromZone(viewDate, slot, viewZone).getTime()
  }

  const getCellState = (officeDay: string, slot: string) => {
    const meta = getEffectiveWorkingHours(officeDay, officeSettings, officeCalendar)

    if (meta.closed || !meta.start || !meta.end) {
      return { className: "wg-cell wg-closed", title: meta.title || "Closed day" }
    }

    const displayDate = getDisplayDateForOfficeDay(officeDay)
    const slotUtcMs = getSlotUtcMs(displayDate, slot)

    if (slotUtcMs == null) {
      return { className: "wg-cell wg-closed", title: "Unavailable" }
    }

    const officeStartUtc = toUtcFromZone(officeDay, meta.start, "Europe/Kyiv").getTime()
    const officeEndUtc = toUtcFromZone(officeDay, meta.end, "Europe/Kyiv").getTime()

    if (slotUtcMs < officeStartUtc || slotUtcMs >= officeEndUtc) {
      return { className: "wg-cell wg-offhours", title: "Outside working hours" }
    }

    const matchedReservation = roomReservations.find((reservation) => {
      const startMs = parseUtc(reservation.start_at).getTime()
      const endMs = parseUtc(reservation.end_at).getTime()
      return slotUtcMs >= startMs && slotUtcMs < endMs
    })

    if (!matchedReservation) {
      return { className: "wg-cell wg-free", title: "Available" }
    }

    const startLabel = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: viewZone,
    }).format(parseUtc(matchedReservation.start_at))

    const endLabel = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: viewZone,
    }).format(parseUtc(matchedReservation.end_at))

    const isMine = myReservationIds?.has(matchedReservation.id) ?? false

    return {
      className: isMine ? "wg-cell wg-mine" : "wg-cell wg-busy",
      title: `${matchedReservation.title} · ${startLabel}-${endLabel}`,
    }
  }

  const windowsValue = room.windows != null ? String(room.windows).trim() : ""

  const metaParts = [
    floorLabel(room.floor),
    `${room.capacity} seats`,
    typeof room.area === "number" && room.area > 0 ? `${room.area} m²` : null,
    windowsValue && windowsValue !== "0" ? `Windows: ${windowsValue}` : null,
  ].filter(Boolean)

  return (
    <div
      className="modal"
      onClick={onClose}
    >
      <div
        className="modal-content week-grid-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="room-head week-grid-modal__head">
          <div className="room-name">
            <div
              className="room-title"
              title={room.name}
            >
              {room.name} · Week grid
            </div>

            <div
              className="room-meta-line"
              title={metaParts.join(" · ")}
            >
              {metaParts.join(" · ")}
            </div>
          </div>
        </div>

        <div className="small week-grid-modal__view">
          Current view: {timeMode === "kyiv" ? "Kyiv time" : "Local time"}
        </div>

        <div className="week-grid-legend">
          <div className="small"><span className="dot dot-free" /> Available</div>
          <div className="small"><span className="dot dot-busy" /> Reserved</div>
          <div className="small"><span className="dot dot-mine" /> My reservation</div>
          <div className="small"><span className="dot dot-offhours" /> Outside hours</div>
          <div className="small"><span className="dot dot-closed" /> Closed day</div>
        </div>

        <div className="week-grid-wrap">
          <div className="week-grid">
            <div className="wg-head wg-time-head">Time</div>

            {dayHeaders.map(({ officeDay, weekday, day, isSelected }) => (
              <div
                key={officeDay}
                className={`wg-head ${isSelected ? "wg-head--selected" : ""}`}
                title={`${weekday} ${day}`}
              >
                <div className="wg-head__weekday">{weekday}</div>
                <div className="wg-head__date">{day}</div>
              </div>
            ))}

            {visibleTimes.map((slot) => (
              <FragmentRow
                key={slot}
                slot={slot}
                weekOfficeDates={weekOfficeDates}
                dayHeaders={dayHeaders}
                getCellState={getCellState}
              />
            ))}
          </div>
        </div>

        <div className="modal-buttons week-grid-modal__actions">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function FragmentRow({
  slot,
  weekOfficeDates,
  dayHeaders,
  getCellState,
}: {
  slot: string
  weekOfficeDates: string[]
  dayHeaders: { officeDay: string; isSelected: boolean }[]
  getCellState: (officeDay: string, slot: string) => { className: string; title: string }
}) {
  return (
    <>
      <div className="wg-time">{slot}</div>

      {weekOfficeDates.map((officeDay) => {
        const cell = getCellState(officeDay, slot)
        const header = dayHeaders.find((d) => d.officeDay === officeDay)
        const selectedClass = header?.isSelected ? " wg-cell--selected-col" : ""

        return (
          <div
            key={`${officeDay}-${slot}`}
            className={`${cell.className}${selectedClass}`}
            title={cell.title}
          />
        )
      })}
    </>
  )
}
