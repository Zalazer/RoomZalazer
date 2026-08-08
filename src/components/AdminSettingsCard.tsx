import type { OfficeCalendarDay, OfficeSettings } from "../hooks/useAppData"
import { getEffectiveWorkingHours } from "../hooks/useAppData"

type Props = {
  officeSettings: OfficeSettings | null
  officeCalendar: OfficeCalendarDay[]
  selectedDate: string
  timeMode: "kyiv" | "local"
  onOpen: () => void
}

const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)

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

const formatTimeForMode = (
  officeDate: string,
  time: string,
  timeMode: "kyiv" | "local"
) => {
  if (timeMode === "kyiv") return time

  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const utc = toUtcFromZone(officeDate, time, "Europe/Kyiv")

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: localZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(utc)
}

const formatSelectedDate = (value: string, timeMode: "kyiv" | "local") => {
  if (!isYmd(value)) return value

  const [y, m, d] = value.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))

  return new Intl.DateTimeFormat("en-GB", {
    timeZone:
      timeMode === "kyiv"
        ? "Europe/Kyiv"
        : Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

export default function AdminSettingsCard({
  officeSettings,
  officeCalendar,
  selectedDate,
  timeMode,
  onOpen,
}: Props) {
  if (!officeSettings) return null

  const officeDate = getOfficeDateForSelectedDate(selectedDate, timeMode)
  const dayMeta = isYmd(officeDate)
    ? getEffectiveWorkingHours(officeDate, officeSettings, officeCalendar)
    : { closed: false, start: "", end: "", isOverride: false, title: "" }

  const weekendMode =
    Number(officeSettings.allow_weekend_booking) === 1 ? "Allowed" : "Disabled"

  const workingHours = dayMeta.closed
    ? "Closed"
    : dayMeta.start && dayMeta.end
      ? `${formatTimeForMode(officeDate, dayMeta.start, timeMode)} – ${formatTimeForMode(
          officeDate,
          dayMeta.end,
          timeMode
        )}`
      : "Not set"

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="section-title">Admin settings</div>
          <div className="small" style={{ marginTop: 6 }}>
            Office configuration and calendar overrides for the selected day.
          </div>
        </div>

        <button type="button" className="btn primary" onClick={onOpen}>
          Edit settings
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <div className="card" style={{ margin: 0 }}>
          <div className="small muted">Office timezone</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>
            {officeSettings.office_timezone || "Europe/Kyiv"}
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="small muted">Default working day</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>
            {officeSettings.working_day_start} – {officeSettings.working_day_end}
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="small muted">Booking rules</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>
            Slot {officeSettings.slot_minutes} min · Min {officeSettings.min_booking_minutes} min
            · Max {officeSettings.max_booking_minutes} min
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="small muted">Weekend booking</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{weekendMode}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, marginBottom: 0 }}>
        <div className="small muted">Selected day</div>
        <div style={{ fontWeight: 600, marginTop: 4 }}>
          {formatSelectedDate(selectedDate, timeMode)}
        </div>

        <div className="small" style={{ marginTop: 10 }}>
          Effective hours: <span style={{ fontWeight: 600 }}>{workingHours}</span>
        </div>

        <div className="small" style={{ marginTop: 6 }}>
          Override:{" "}
          <span style={{ fontWeight: 600 }}>
            {dayMeta.isOverride ? "Yes" : "No"}
          </span>
          {dayMeta.title ? ` · ${dayMeta.title}` : ""}
        </div>
      </div>
    </div>
  )
}
