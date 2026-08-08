import "./App.css"
import { useMemo, useState } from "react"
import HeaderCard from "./components/HeaderCard"
import CalendarHeader from "./components/CalendarHeader"
import WeekSelector from "./components/WeekSelector"
import RoomCard from "./components/RoomCard"
import RoomDetailsModal from "./components/RoomDetailsModal"
import ReservationList from "./components/ReservationList"
import ReservationModal from "./components/ReservationModal"
import ProfileModal from "./components/ProfileModal"
import AdminSettingsCard from "./components/AdminSettingsCard"
import AdminSettingsModal from "./components/AdminSettingsModal"
import ReminderPopup from "./components/ReminderPopup"
import { useAppData, getEffectiveWorkingHours } from "./hooks/useAppData"
import useReservationAlerts from "./hooks/useReservationAlerts"

type RoomSortField = "name" | "floor" | "seats"

const getSafeTimeZone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && typeof tz === "string" && tz.trim()) return tz
  } catch {}
  return "UTC"
}

const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)
const isHm = (v: string) => /^\d{2}:\d{2}$/.test(v)

const safeUtcMs = (v?: string | null) => {
  if (!v) return null
  const raw = String(v).trim()
  const d = new Date(raw.endsWith("Z") ? raw : `${raw.replace(" ", "T")}Z`)
  const ms = d.getTime()
  return Number.isNaN(ms) ? null : ms
}

const parseReservationDate = (value: string, mode: "kyiv" | "local") => {
  const raw = String(value || "")
  const utc = new Date(raw.endsWith("Z") ? raw : `${raw.replace(" ", "T")}Z`)

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: mode === "kyiv" ? "Europe/Kyiv" : getSafeTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(utc)
}

const formatYmdInZone = (date: Date, zone: string) => {
  try {
    const text = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)

    if (isYmd(text)) return text

    const parts = text.split(/[./-]/).map((v) => v.trim())
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`
    }

    return text
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }
}

const getUtcMsFromWallClock = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number)
  const [h, min] = time.split(":").map(Number)
  return Date.UTC(y, m - 1, d, h, min, 0, 0)
}

const toUtcFromZoneSafe = (date: string, time: string, zone: string) => {
  if (!isYmd(date) || !isHm(time)) return new Date(NaN)

  try {
    const utcGuess = new Date(getUtcMsFromWallClock(date, time))

    const rendered = new Intl.DateTimeFormat("sv-SE", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(utcGuess)

    const match = rendered.match(
      /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/
    )

    if (!match) return utcGuess

    const seenY = Number(match[1])
    const seenM = Number(match[2])
    const seenD = Number(match[3])
    const seenH = Number(match[4])
    const seenMin = Number(match[5])

    const desired = Date.UTC(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
      Number(time.slice(0, 2)),
      Number(time.slice(3, 5))
    )

    const seen = Date.UTC(seenY, seenM - 1, seenD, seenH, seenMin)
    const diff = desired - seen

    return new Date(utcGuess.getTime() + diff)
  } catch {
    return new Date(getUtcMsFromWallClock(date, time))
  }
}

const getOfficeDateForSelectedDate = (
  selectedDate: string,
  timeMode: "kyiv" | "local"
) => {
  if (!isYmd(selectedDate)) return selectedDate
  if (timeMode === "kyiv") return selectedDate

  const localZone = getSafeTimeZone()
  const localMiddayUtc = toUtcFromZoneSafe(selectedDate, "12:00", localZone)

  if (Number.isNaN(localMiddayUtc.getTime())) return selectedDate

  return formatYmdInZone(localMiddayUtc, "Europe/Kyiv")
}

export default function App() {
  const a = useAppData()
  const [editingReservationId, setEditingReservationId] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<RoomSortField>("seats")
  const [showAdminSettings, setShowAdminSettings] = useState(false)
  const [reminderPopup, setReminderPopup] = useState<{
    open: boolean
    type: "before_start" | "before_end" | null
    reservation: any | null
    endsAtMs: number | null
  }>({
    open: false,
    type: null,
    reservation: null,
    endsAtMs: null,
  })

  const safeNowUtcMs =
    typeof a.nowUtcMs === "number" && Number.isFinite(a.nowUtcMs)
      ? a.nowUtcMs
      : Date.now()

  const myReservationIds = useMemo(
    () => new Set((a.myReservations ?? []).map((r) => r.id)),
    [a.myReservations]
  )

  const requestBrowserNotificationPermission = () => {
    if (typeof window === "undefined") return
    if (!("Notification" in window)) return
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {})
    }
  }

  const playLoginTestSound = () => {
    const audio = new Audio("/sounds/chime.mp3")
    audio.currentTime = 0
    audio.loop = false
    audio.play().catch(() => {})
    window.setTimeout(() => {
      audio.pause()
      audio.currentTime = 0
    }, 2500)
  }

  const handleAuthAction = async (mode: "login" | "register") => {
    playLoginTestSound()
    requestBrowserNotificationPermission()

    if (mode === "register") {
      await a.register()
      return
    }

    await a.login()
  }

  useReservationAlerts({
    reservations: a.reservations,
    myReservationIds,
    nowUtcMs: safeNowUtcMs,
    officeSettings: a.officeSettings,
    enabled: a.status !== "booting" && a.status !== "guest" && a.status !== "error",
    onNotify: ({ type, reservation, minutesLeft }) => {
      const targetMs =
        type === "before_start"
          ? safeUtcMs(reservation.start_at)
          : safeUtcMs(reservation.end_at)

      if (targetMs == null) return

      setReminderPopup({
        open: true,
        type,
        reservation,
        endsAtMs: targetMs,
      })

      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          const title =
            type === "before_start"
              ? "Reservation starts soon"
              : "Reservation ends soon"

          const body =
            type === "before_start"
              ? `${reservation.title || "Untitled reservation"} starts in ${minutesLeft} min`
              : `${reservation.title || "Untitled reservation"} ends in ${minutesLeft} min`

          try {
            new Notification(title, { body })
          } catch {}
        }
      }
    },
  })

  const officeDate = getOfficeDateForSelectedDate(a.selectedDate, a.timeMode)
  const todayInKyiv = formatYmdInZone(new Date(safeNowUtcMs), "Europe/Kyiv")

  const dayMeta = getEffectiveWorkingHours(
    officeDate,
    a.officeSettings,
    a.officeCalendar
  )

  const officeEndUtcMs =
    dayMeta.end && isYmd(officeDate) && isHm(dayMeta.end)
      ? toUtcFromZoneSafe(officeDate, dayMeta.end, "Europe/Kyiv").getTime()
      : null

  const isCreateDisabledForSelectedDay =
    !isYmd(officeDate) ||
    dayMeta.closed ||
    officeDate < todayInKyiv ||
    (officeDate === todayInKyiv &&
      officeEndUtcMs != null &&
      Number.isFinite(officeEndUtcMs) &&
      safeNowUtcMs >= officeEndUtcMs)

  const sortedRooms = useMemo(() => {
    const rooms = [...a.rooms]

    rooms.sort((left, right) => {
      if (sortBy === "name") {
        return String(left.name || "").localeCompare(String(right.name || ""))
      }

      if (sortBy === "floor") {
        const byFloor = Number(left.floor || 0) - Number(right.floor || 0)
        if (byFloor !== 0) return byFloor
        return String(left.name || "").localeCompare(String(right.name || ""))
      }

      const leftSeats = Number(left.capacity ?? 0)
      const rightSeats = Number(right.capacity ?? 0)
      const bySeats = leftSeats - rightSeats

      if (bySeats !== 0) return bySeats

      return String(left.name || "").localeCompare(String(right.name || ""))
    })

    return rooms
  }, [a.rooms, sortBy])

  const handleOpenCreate = () => {
    if (isCreateDisabledForSelectedDay) return
    setEditingReservationId(null)
    a.setShowModal(true)
  }

  const handleEditReservation = (id: number) => {
    const reservation =
      a.currentReservations.find((r) => r.id === id) ??
      a.pastReservations.find((r) => r.id === id) ??
      a.reservations.find((r) => r.id === id)

    if (reservation?.start_at) {
      const nextDate = parseReservationDate(reservation.start_at, a.timeMode)
      a.setSelectedDate(nextDate)
    }

    setEditingReservationId(id)
    a.editReservation(id)
  }

  const handleCloseModal = () => {
    a.setShowModal(false)
    setEditingReservationId(null)
  }

  const selectedRoom = a.selectedRoom

  if (a.status === "booting") {
    return (
      <div className="container">
        <div className="card">
          <h1>RoomZalazer</h1>
          <div className="subtitle">Smart Meeting Room Reservation Platform</div>
          <div className="small">Initializing application...</div>
        </div>
      </div>
    )
  }

  if (a.status === "error") {
    return (
      <div className="container">
        <div className="card">
          <h1>RoomZalazer</h1>
          <div className="subtitle">Smart Meeting Room Reservation Platform</div>

          <div
            className="error"
            style={{ marginBottom: "12px" }}
          >
            {a.appError || "Application failed to load."}
          </div>

          <button
            className="primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>

          {!!a.token && (
            <button
              className="secondary"
              style={{ marginTop: "10px" }}
              onClick={a.logout}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    )
  }

  if (a.status === "guest") {
    return (
      <div className="container">
        <div className="card">
          <h1>RoomZalazer</h1>
          <div className="subtitle">Smart Meeting Room Reservation Platform</div>

          <input
            type="email"
            placeholder="Email"
            value={a.email}
            onChange={(e) => a.setEmail(e.target.value)}
          />

          {!!a.loginError && <div className="error">{a.loginError}</div>}

          <input
            type="password"
            placeholder="Password"
            value={a.password}
            onChange={(e) => a.setPassword(e.target.value)}
          />

          {a.registerMode && (
            <input
              placeholder="Name"
              value={a.name}
              onChange={(e) => a.setName(e.target.value)}
            />
          )}

          {!!a.registerError && <div className="error">{a.registerError}</div>}

          <button
            className="primary"
            onClick={() =>
              handleAuthAction(a.registerMode ? "register" : "login")
            }
          >
            {a.registerMode ? "Register" : "Login"}
          </button>

          <button
            className="secondary"
            onClick={() => {
              a.resetAuthForm({ keepEmail: true })
              a.setRegisterMode(!a.registerMode)
            }}
          >
            {a.registerMode ? "Back to Login" : "Create Account"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container">
        <HeaderCard
          user={a.user?.name}
          time={a.time}
          localTime={a.localTime}
          timeMode={a.timeMode}
          setTimeMode={a.setTimeMode}
          workingHoursText={a.workingHoursText}
          rooms={a.rooms.length}
          current={a.currentReservations.length}
          past={a.pastReservations.length}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onLogout={a.logout}
          onEdit={a.openProfile}
          onCurrent={() => {
            a.setShowCurrent(!a.showCurrent)
            a.setShowPast(false)
          }}
          onPast={() => {
            a.setShowPast(!a.showPast)
            a.setShowCurrent(false)
          }}
        />

        {a.user?.role === "admin" && (
          <AdminSettingsCard
            officeSettings={a.officeSettings}
            officeCalendar={a.officeCalendar}
            selectedDate={a.selectedDate}
            timeMode={a.timeMode}
            onOpen={() => setShowAdminSettings(true)}
          />
        )}

        {a.showCurrent && (
          <ReservationList
            title="Current Reservations"
            reservations={a.currentReservations}
            rooms={sortedRooms}
            sortBy={sortBy}
            timeMode={a.timeMode}
            formatDateTime={a.formatDateTime}
            nowUtcMs={safeNowUtcMs}
            onDelete={a.deleteReservation}
            onEdit={handleEditReservation}
            onOpenPast={(r) => {
              const nextDate = parseReservationDate(r.start_at, a.timeMode)
              a.setSelectedDate(nextDate)

              const room = a.rooms.find((v) => v.id === r.room_id)
              if (room) a.setSelectedRoom(room)
            }}
          />
        )}

        {a.showPast && (
          <ReservationList
            title="Past Reservations"
            reservations={a.pastReservations}
            rooms={sortedRooms}
            sortBy={sortBy}
            timeMode={a.timeMode}
            formatDateTime={a.formatDateTime}
            nowUtcMs={safeNowUtcMs}
            onDelete={a.deleteReservation}
            onEdit={handleEditReservation}
            onOpenPast={(r) => {
              const nextDate = parseReservationDate(r.start_at, a.timeMode)
              a.setSelectedDate(nextDate)

              const room = a.rooms.find((v) => v.id === r.room_id)
              if (room) a.setSelectedRoom(room)
            }}
          />
        )}

        <CalendarHeader
          selectedDate={a.selectedDate}
          formatDate={a.formatDate}
        />

        <WeekSelector
          selectedDate={a.selectedDate}
          setSelectedDate={a.setSelectedDate}
          formatDate={a.formatDate}
          todayDate={a.todayDate}
          formatWeekdayShort={a.formatWeekdayShort}
          formatDayNumber={a.formatDayNumber}
          officeSettings={a.officeSettings}
          officeCalendar={a.officeCalendar}
        />

        {sortedRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            reservations={a.reservations}
            selectedDate={a.selectedDate}
            timeMode={a.timeMode}
            times={a.TIMES}
            officeSettings={a.officeSettings}
            officeCalendar={a.officeCalendar}
            nowUtcMs={safeNowUtcMs}
            onClick={() => a.setSelectedRoom(room)}
            myReservationIds={myReservationIds}
          />
        ))}

        <div className="footer">RoomZalazer • Google Calendar Style</div>
      </div>

      <button
        className={`float ${isCreateDisabledForSelectedDay ? "float-disabled" : ""}`}
        onClick={handleOpenCreate}
        disabled={isCreateDisabledForSelectedDay}
        title={
          isCreateDisabledForSelectedDay
            ? "This working day has ended."
            : "Create reservation"
        }
      >
        +
      </button>

      <ReservationModal
        show={a.showModal}
        rooms={sortedRooms}
        times={a.TIMES}
        reservations={a.reservations}
        selectedDate={a.selectedDate}
        timeMode={a.timeMode}
        title={a.title}
        setTitle={a.setTitle}
        roomId={a.roomId}
        setRoomId={a.setRoomId}
        start={a.start}
        setStart={a.setStart}
        end={a.end}
        setEnd={a.setEnd}
        onReserve={a.reserveRoom}
        onClose={handleCloseModal}
        editing={a.editing}
        editingReservationId={editingReservationId}
        error={a.reserveError}
        loading={a.isReserving}
        officeSettings={a.officeSettings}
        nowUtcMs={safeNowUtcMs}
      />

      <ProfileModal
        show={a.showProfileModal}
        name={a.profileName}
        setName={a.setProfileName}
        email={a.profileEmail}
        setEmail={a.setProfileEmail}
        password={a.profilePassword}
        setPassword={a.setProfilePassword}
        error={a.profileError}
        success={a.profileSuccess}
        onSave={a.updateProfile}
        onClose={() => a.setShowProfileModal(false)}
      />

      <AdminSettingsModal
        open={showAdminSettings}
        onClose={() => setShowAdminSettings(false)}
        officeSettings={a.officeSettings}
        officeCalendar={a.officeCalendar}
        selectedDate={a.selectedDate}
        adminSettingsError={a.adminSettingsError}
        adminSettingsSuccess={a.adminSettingsSuccess}
        isSavingAdminSettings={a.isSavingAdminSettings}
        updateOfficeSettings={a.updateOfficeSettings}
        upsertOfficeCalendarDay={a.upsertOfficeCalendarDay}
        deleteOfficeCalendarDay={a.deleteOfficeCalendarDay}
      />

      <ReminderPopup
        open={reminderPopup.open}
        type={reminderPopup.type}
        reservation={reminderPopup.reservation}
        endsAtMs={reminderPopup.endsAtMs}
        onClose={() =>
          setReminderPopup({
            open: false,
            type: null,
            reservation: null,
            endsAtMs: null,
          })
        }
      />

      {selectedRoom && (
        <RoomDetailsModal
          room={selectedRoom}
          reservations={a.reservations}
          selectedDate={a.selectedDate}
          timeMode={a.timeMode}
          times={a.TIMES}
          myReservationIds={myReservationIds}
          officeSettings={a.officeSettings}
          officeCalendar={a.officeCalendar}
          nowUtcMs={safeNowUtcMs}
          onClose={() => a.setSelectedRoom(null)}
          onCreate={() => {
            if (isCreateDisabledForSelectedDay) return
            setEditingReservationId(null)
            a.setRoomId(String(selectedRoom.id))
            a.setSelectedRoom(null)
            a.setShowModal(true)
          }}
        />
      )}
    </>
  )
}
