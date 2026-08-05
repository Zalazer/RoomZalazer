import type { Room, Reservation } from "../hooks/useAppData"

type Props = {
  room: Room
  reservations: Reservation[]
  selectedDate: string
  timeMode: "kyiv" | "local"
  times: string[]
  onClose: () => void
  onCreate: () => void
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

export default function RoomDetailsModal({
  room,
  reservations,
  selectedDate,
  timeMode,
  times,
  onClose,
  onCreate,
}: Props) {
  const zone =
    timeMode === "kyiv"
      ? "Europe/Kyiv"
      : Intl.DateTimeFormat().resolvedOptions().timeZone

  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: zone,
  })

  const fmt = (v: string) => timeFormatter.format(new Date(`${v}Z`))
  const dateOf = (v: string) => toYmd(new Date(`${v}Z`), zone)

  const list = reservations
    .filter(
      (r) =>
        r.room_id === room.id &&
        r.status !== "cancelled" &&
        dateOf(r.start_at) === selectedDate
    )
    .sort(
      (a, b) =>
        new Date(`${a.start_at}Z`).getTime() - new Date(`${b.start_at}Z`).getTime()
    )

  const floorSuffix =
    room.floor === 1 ? "st" : room.floor === 2 ? "nd" : room.floor === 3 ? "rd" : "th"

  return (
    <div className="modal">
      <div className="modal-content room-modal">
        <h2 style={{ marginBottom: "10px" }}>
          {room.name}
          {" · "}
          {room.floor}
          {floorSuffix}
          {" floor · Capacity "}
          {room.capacity}
          {room.area != null && ` · ${room.area} m²`}
        </h2>

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
          Viewing in {timeMode === "kyiv" ? "Kyiv time" : "your local time"}
        </div>

        {times.map((time) => {
          const item = list.find((r) => {
            const start = fmt(r.start_at)
            const end = fmt(r.end_at)
            return time >= start && time < end
          })

          return (
            <div
              key={time}
              className="info room-slot"
              style={{
                color: item ? "#ffc0c0" : "#97ffbd",
              }}
            >
              <span>{time}</span>

              <span>
                {item
                  ? `${fmt(item.start_at)}-${fmt(item.end_at)} ${item.user_name ?? "Reserved"}`
                  : "FREE"}
              </span>
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

          <button
            className="primary"
            onClick={onCreate}
          >
            Create Reservation
          </button>
        </div>
      </div>
    </div>
  )
}
