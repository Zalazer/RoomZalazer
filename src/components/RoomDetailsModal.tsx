import type { Room, Reservation } from "../hooks/useAppData"

type Props = {
  room: Room
  reservations: Reservation[]
  selectedDate: string
  timeMode: "kyiv" | "local"
  times: string[]
  onClose: () => void
  onCreate: () => void
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

const cutSingleLine = (value: unknown, max = 56) => {
  const text = String(value ?? "").trim()
  if (!text) return ""
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export default function RoomDetailsModal({
  room,
  reservations,
  selectedDate,
  timeMode,
  times,
  onClose,
  onCreate,
  myReservationIds,
}: Props) {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const zone =
    timeMode === "kyiv"
      ? "Europe/Kyiv"
      : localZone

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
    const kyivText = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Kyiv",
    }).format(slotUtc)

    return `${time} (${kyivText})`
  }

  const isOwnReservation = (reservation: Reservation | undefined) => {
    if (!reservation) return false
    return myReservationIds?.has(reservation.id) ?? false
  }

  return (
    <div className="modal">
      <div className="modal-content room-modal">
        <div className="room-modal__head">
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
          <div className="room-modal__aux small">
            {room.features.join(" • ")}
          </div>
        )}

        {room.equipment && (
          <div className="room-modal__aux small">
            Equipment: {room.equipment}
          </div>
        )}

        <div className="room-modal__viewing small">
          {viewingLabel}
        </div>

        <div className="room-slot-head">
          <span className="room-slot-head__time">
            <span className="room-slot-head__time-main">
              {timeMode === "kyiv" ? "Time" : "Local time"}
            </span>

            {timeMode === "local" && (
              <span className="room-slot-head__time-sub">Kyiv time</span>
            )}
          </span>

          <span className="room-slot-head__label">Owner — Title</span>
        </div>

        <div className="room-slots">
          {visibleTimes.map((time) => {
            const slotUtcMs = toUtcFromDisplay(selectedDate, time, zone).getTime()

            const item = list.find((r) => {
              const startMs = parseUtc(r.start_at).getTime()
              const endMs = parseUtc(r.end_at).getTime()
              return slotUtcMs >= startMs && slotUtcMs < endMs
            })

            const isOwn = isOwnReservation(item)

            const slotClass = item
              ? isOwn
                ? "room-slot--own"
                : "room-slot--other"
              : "room-slot--free"

            const meetingTitle = cutSingleLine(item?.title, 38)
            const ownerName = cutSingleLine(item?.user_name, 20)

            const label = item
              ? [ownerName, meetingTitle].filter(Boolean).join(" — ") || "Reserved"
              : "FREE"

            const fullLabel = item
              ? [String(item?.user_name || "").trim(), String(item?.title || "").trim()]
                  .filter(Boolean)
                  .join(" — ")
              : "FREE"

            return (
              <div
                key={time}
                className={`room-slot ${slotClass}`}
              >
                <span
                  className="room-slot__time"
                  title={formatSlotTime(time)}
                >
                  {formatSlotTime(time)}
                </span>

                <span
                  className={[
                    "room-slot__label",
                    isOwn ? "room-slot__label--own" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={fullLabel}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="modal-buttons room-modal__buttons">
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
