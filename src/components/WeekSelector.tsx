type OfficeSettings = {
  allow_weekend_booking: number
}

type OfficeCalendarDay = {
  date: string
  is_working_day: number
  working_start: string | null
  working_end: string | null
  title: string | null
}

type Props = {
  selectedDate: string
  setSelectedDate: (v: string) => void
  formatDate: (v: string) => string
  todayDate: string
  formatWeekdayShort: (v: string) => string
  formatDayNumber: (v: string) => string
  officeSettings: OfficeSettings | null
  officeCalendar: OfficeCalendarDay[]
}

const pad = (n: number) => String(n).padStart(2, "0")

const isYmd = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

const fromYmd = (value: string) => {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const toYmd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const getCalendarOverride = (
  officeCalendar: OfficeCalendarDay[],
  value: string
) => officeCalendar.find((v) => v.date === value) || null

const isWeekend = (date: Date) => {
  const day = date.getDay()
  return day === 0 || day === 6
}

const getDayState = (
  value: string,
  officeSettings: OfficeSettings | null,
  officeCalendar: OfficeCalendarDay[]
) => {
  const override = getCalendarOverride(officeCalendar, value)

  if (override) {
    return {
      isWorking: Number(override.is_working_day) === 1,
      isOverride: true,
      title: override.title || "",
    }
  }

  const date = fromYmd(value)
  const weekend = isWeekend(date)
  const allowWeekend = Number(officeSettings?.allow_weekend_booking ?? 0) === 1

  if (weekend && !allowWeekend) {
    return {
      isWorking: false,
      isOverride: false,
      title: "",
    }
  }

  return {
    isWorking: true,
    isOverride: false,
    title: "",
  }
}

export default function WeekSelector({
  selectedDate,
  setSelectedDate,
  formatDate,
  todayDate,
  formatWeekdayShort,
  formatDayNumber,
  officeSettings,
  officeCalendar,
}: Props) {
  const safeToday = isYmd(todayDate) ? todayDate : toYmd(new Date())

  const current =
    isYmd(selectedDate)
      ? fromYmd(selectedDate)
      : fromYmd(safeToday)

  function addWeek(days: number) {
    const d = new Date(current)
    d.setDate(d.getDate() + days)
    setSelectedDate(toYmd(d))
  }

  function changeMonth(dir: -1 | 1) {
    const d = new Date(current)
    const originalDay = d.getDate()

    d.setDate(1)
    d.setMonth(d.getMonth() + dir)

    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    d.setDate(Math.min(originalDay, maxDay))

    setSelectedDate(toYmd(d))
  }

  const weekStart = new Date(current)
  weekStart.setDate(current.getDate() - ((current.getDay() + 6) % 7))

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "12px",
          justifyContent: "center",
          flexWrap: "nowrap",
        }}
      >
        <button
          className="secondary"
          style={{
            padding: "8px 10px",
            fontSize: "14px",
          }}
          onClick={() => changeMonth(-1)}
        >
          {"<< M"}
        </button>

        <button
          className="secondary"
          style={{
            padding: "8px 10px",
            fontSize: "14px",
          }}
          onClick={() => addWeek(-7)}
        >
          {"< W"}
        </button>

        <button
          className="primary"
          style={{
            padding: "8px 10px",
            fontSize: "14px",
          }}
          onClick={() => setSelectedDate(safeToday)}
        >
          Today
        </button>

        <button
          className="secondary"
          style={{
            padding: "8px 10px",
            fontSize: "14px",
          }}
          onClick={() => addWeek(7)}
        >
          {"W >"}
        </button>

        <button
          className="secondary"
          style={{
            padding: "8px 10px",
            fontSize: "14px",
          }}
          onClick={() => changeMonth(1)}
        >
          {"M >>"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "4px",
          justifyContent: "center",
          flexWrap: "nowrap",
        }}
      >
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date(weekStart)
          d.setDate(weekStart.getDate() + i)

          const value = toYmd(d)
          const dayState = getDayState(value, officeSettings, officeCalendar)
          const isSelected = value === selectedDate
          const isToday = value === safeToday
          const isClosed = !dayState.isWorking

          return (
            <button
              key={value}
              className={isSelected ? "primary" : "secondary"}
              style={{
                padding: "6px",
                fontSize: "12px",
                minWidth: "44px",
                lineHeight: "1.1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                opacity: isClosed ? 0.45 : 1,
                border:
                  !isSelected && isToday
                    ? "1px solid rgba(255,255,255,.35)"
                    : undefined,
                background:
                  isSelected
                    ? undefined
                    : isClosed
                    ? "rgba(255,87,87,.15)"
                    : dayState.isOverride
                    ? "rgba(80,180,120,.14)"
                    : undefined,
              }}
              onClick={() => setSelectedDate(value)}
              title={
                isClosed
                  ? dayState.title || "Office closed"
                  : dayState.isOverride
                  ? dayState.title || "Custom working day"
                  : formatDate(value)
              }
            >
              <span>{formatWeekdayShort(value)}</span>
              <span>{formatDayNumber(value)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
