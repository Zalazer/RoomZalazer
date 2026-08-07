import type { Room, Reservation } from "../hooks/useAppData"

type Props = {
  room: Room
  reservations: Reservation[]
  selectedDate: string
  timeMode: "kyiv" | "local"
  times: string[]
  onClose: () => void
  onCreate: () => void
  userId?: number | null
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

function toUtcFromDisplay(date: string, time: string, zone: string) {
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

export default function RoomDetailsModal({
  room,
  reservations,
  selectedDate,
  timeMode,
  times,
  onClose,
  onCreate,
  userId = null,
}: Props) {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const zone =
    timeMode === "kyiv"
      ? "Europe/Kyiv"
      : localZone

  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: zone,
  })

  const kyivTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Kyiv",
  })

  const fmt = (v: string) => timeFormatter.format(parseUtc(v))
  const fmtKyiv = (v: string) => kyivTimeFormatter.format(parseUtc(v))
  const dateOf = (v: string) => toYmd(parseUtc(v), zone)

  const list = reservations
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

  const visibleTimes = times.length > 1 ? times.slice(0, -1) : times

  const floorLabel = (n: number) => {
    if (n === 1) return "1st floor"
    if (n === 2) return "2nd floor"
    if (n === 3) return "3rd floor"
    return `${n}th floor`
  }

  const windowsValue =
    room.windows != null ? String(room.windows).trim() : ""

  const metaParts = [
    floorLabel(room.floor),
    `${room.capacity} seats`,
    typeof room.area === "number" && room.area > 0 ? `${room.area} m²` : null,
    windowsValue && windowsValue !== "0" ? `Windows: ${windowsValue}` : null,
  ].filter(Boolean)

  const selectedDateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: zone,
  }).format(toUtcFromDisplay(selectedDate, "12:00", zone))

  const viewingLabel =
    `${selectedDateLabel}, ${timeMode === "kyiv" ? "Kyiv time" : "Local time"}`

  const todayInKyiv = toYmd(new Date(), "Europe/Kyiv")
  const officeDate =
    timeMode === "kyiv"
      ? selectedDate
      : toYmd(toUtcFromDisplay(selectedDate, "12:00", localZone), "Europe/Kyiv")

  const isPastOfficeDate = officeDate < todayInKyiv

  const formatSlotTime = (time: string) => {
    if (timeMode === "kyiv") return time

    const slotUtc = toUtcFromDisplay(selectedDate, time, zone)
    const kyivText = kyivTimeFormatter.format(slotUtc)

    return `${time} (${kyivText} Kyiv)`
  }

  return (
    <div className="modal">
      <div className="modal-content room-modal">
        <div
          className="room-name"
          style={{ marginBottom: "10px" }}
        >
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

        {!!room.features?.length && (
          <div
            className="small"
            style={{ marginBottom: "6px" }}
          >
            {room.features.join(" • ")}
          </div>
        )}

        {room.equipment && (
          <div
            className="small"
            style={{ marginBottom: "6px" }}
          >
            Equipment: {room.equipment}
          </div>
        )}

        <div
          className="small"
          style={{ marginBottom: "12px" }}
        >
          {viewingLabel}
        </div>

        {visibleTimes.map((time) => {
          const slotUtcMs = toUtcFromDisplay(selectedDate, time, zone).getTime()

          const item = list.find((r) => {
            const startMs = parseUtc(r.start_at).getTime()
            const endMs = parseUtc(r.end_at).getTime()
            return slotUtcMs >= startMs && slotUtcMs < endMs
          })

          const isOwn =
            !!item &&
            userId != null &&
            (
              Number((item as any).user_id) === Number(userId) ||
              Number((item as any).created_by) === Number(userId) ||
              Number((item as any).user?.id) === Number(userId)
            )

          const slotClass = item
            ? isOwn
              ? "room-slot--own"
              : "room-slot--other"
            : "room-slot--free"

          const label = item
            ? timeMode === "kyiv"
              ? `${fmt(item.start_at)}-${fmt(item.end_at)} ${item.user_name ?? "Reserved"}`
              : `${fmt(item.start_at)}-${fmt(item.end_at)} (${fmtKyiv(item.start_at)}-${fmtKyiv(item.end_at)} Kyiv) ${item.user_name ?? "Reserved"}`
            : "FREE"

          return (
            <div
              key={time}
              className={`info room-slot ${slotClass}`}
            >
              <span>{formatSlotTime(time)}</span>

              <span>{label}</span>
            </div>
          )
        })}

        <div className="modal-buttons">
          <button
            className="secondary"
            onClick={onClose}
          >
            Close
          </button>

          {!isPastOfficeDate && (
            <button
              className="primary"
              onClick={onCreate}
            >
              Create Reservation
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
