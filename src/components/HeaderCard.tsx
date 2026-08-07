type RoomSortField = "name" | "floor" | "seats"

type Props = {
  time: string
  localTime: string
  rooms: number
  current: number
  past: number
  timeMode: "kyiv" | "local"
  setTimeMode: (v: "kyiv" | "local") => void
  workingHoursText: string
  sortBy: RoomSortField
  setSortBy: (v: RoomSortField) => void
  user?: string
  onLogout?: () => void
  onEdit?: () => void
  onCurrent?: () => void
  onPast?: () => void
}

export default function HeaderCard({
  time,
  localTime,
  rooms,
  current,
  past,
  timeMode,
  setTimeMode,
  workingHoursText,
  sortBy,
  setSortBy,
  user,
  onLogout,
  onEdit,
  onCurrent,
  onPast,
}: Props) {
  const hasCurrentReservations = current > 0

  return (
    <div className="card">
      <h1>RoomZalazer</h1>

      <div className="subtitle">
        Smart Meeting Room Reservation Platform
      </div>

      {!!user && (
        <div className="user-row">
          <span>{user}</span>

          <div className="header-actions">
            <button
              className="secondary header-btn header-btn--compact"
              onClick={onEdit}
            >
              Edit Profile
            </button>

            <button
              className="logout"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="info">
        <span>Kyiv Time</span>
        <span>{time}</span>
      </div>

      <div className="info">
        <span>Local Time</span>
        <span>{localTime}</span>
      </div>

      <div className="info">
        <span>Working Hours</span>

        <div className="info-actions">
          <span>{workingHoursText || "—"}</span>

          <button
            className="primary header-btn header-btn--compact header-btn--toggle"
            onClick={() =>
              setTimeMode(timeMode === "kyiv" ? "local" : "kyiv")
            }
          >
            {timeMode === "kyiv" ? "Kyiv" : "Local"}
          </button>
        </div>
      </div>

      <div className="info">
        <span>Total Rooms</span>

        <div className="info-actions info-actions--rooms">
          <span>{rooms}</span>
          <span className="small header-inline-label">sorted by</span>

          <select
            className="header-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as RoomSortField)}
          >
            <option value="name">name</option>
            <option value="floor">floor</option>
            <option value="seats">seats</option>
          </select>
        </div>
      </div>

      <div className="info">
        <span>My Reservations</span>

        <div className="reservation-tabs">
          <button
            className={`secondary header-btn header-btn--compact ${
              hasCurrentReservations ? "has-active" : ""
            }`}
            onClick={onCurrent}
          >
            Current ({current})
          </button>

          <button
            className="secondary header-btn header-btn--compact"
            onClick={onPast}
          >
            Past ({past})
          </button>
        </div>
      </div>
    </div>
  )
}
