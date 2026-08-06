import { useEffect, useMemo, useState } from "react"

const API = "https://meeting.shooleeyack.workers.dev"

export const TIMES: string[] = []

export type User = {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: string
  active: boolean
}

export type Room = {
  id: number
  name: string
  description: string
  capacity: number
  floor: number
  area?: number | null
  windows?: string | null
  equipment?: string | null
  photo_url?: string | null
  features?: string[]
  photos?: {
    photo_url: string
    sort_order: number
  }[]
}

export type Reservation = {
  id: number
  room_id: number
  title: string
  start_at: string
  end_at: string
  status?: string
  user_name?: string
  room: {
    id: number
    name: string
    description: string
    capacity: number
    floor: number
    area?: number | null
    windows?: string | null
    equipment?: string | null
    photo_url?: string | null
    features: string[]
    photos: {
      photo_url: string
      sort_order: number
    }[]
  }
}

export type OfficeSettings = {
  id: number
  office_timezone: string
  working_day_start: string
  working_day_end: string
  slot_minutes: number
  min_booking_minutes: number
  max_booking_minutes: number
  notify_before_minutes: number
  min_password_length: number
  max_password_length: number
  min_title_length: number
  max_title_length: number
  max_description_length: number
  max_future_booking_days: number
  allow_weekend_booking: number
  created_at?: string
  updated_at?: string
}

export type OfficeCalendarDay = {
  date: string
  is_working_day: number
  working_start: string | null
  working_end: string | null
  title: string | null
}

type AppStatus = "booting" | "guest" | "ready" | "error"

const pad = (n: number) => String(n).padStart(2, "0")

const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)
const isHm = (v: string) => /^\d{2}:\d{2}$/.test(v)

const mins = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5))

const minutesToTime = (v: number) =>
  `${pad(Math.floor(v / 60))}:${pad(v % 60)}`


function isWithinWorkingBounds(
  startMinutes: number,
  endMinutes: number,
  boundsStart: number,
  boundsEnd: number
) {
  if (boundsEnd > boundsStart) {
    return startMinutes >= boundsStart && endMinutes <= boundsEnd
  }

  const normalize = (value: number) =>
    value < boundsStart ? value + 1440 : value

  const s = normalize(startMinutes)
  const e = normalize(endMinutes)
  const endBound = boundsEnd + 1440

  return s >= boundsStart && e <= endBound && e > s
}


function parseUtcDateTime(value: string) {
  const normalized = String(value || "").replace(" ", "T")
  return new Date(`${normalized}Z`)
}

function ymdFromDate(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value || ""

  return `${get("year")}-${get("month")}-${get("day")}`
}

function hmFromDate(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00"

  return `${get("hour")}:${get("minute")}`
}

function localYmd(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function utcDateFromYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

function kyivYmd(date: Date) {
  return ymdFromDate(date, "Europe/Kyiv")
}

function kyivHm(date: Date) {
  return hmFromDate(date, "Europe/Kyiv")
}

function getCurrentUtc(serverNow: string, serverReceivedAt: number) {
  return serverNow
    ? new Date(parseUtcDateTime(serverNow).getTime() + (Date.now() - serverReceivedAt))
    : new Date()
}

function getTodayYmd(
  mode: "kyiv" | "local",
  serverNow: string,
  serverReceivedAt: number
) {
  const nowUTC = getCurrentUtc(serverNow, serverReceivedAt)
  return mode === "kyiv" ? kyivYmd(nowUTC) : localYmd(nowUTC)
}

export const formatKyivDate = (utc: Date) => kyivYmd(utc)

export const formatKyivTime = (utc: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(utc)

export const fromUTC = (value: string, mode: "kyiv" | "local") =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone:
      mode === "kyiv"
        ? "Europe/Kyiv"
        : Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(parseUtcDateTime(value))

export const toUTC = (
  date: string,
  time: string,
  mode: "kyiv" | "local"
) => {
  const [y, m, d] = date.split("-").map(Number)
  const [h, min] = time.split(":").map(Number)

  const displayTimeZone =
    mode === "kyiv"
      ? "Europe/Kyiv"
      : Intl.DateTimeFormat().resolvedOptions().timeZone

  const probeUtc = new Date(Date.UTC(y, m - 1, d, h, min))

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: displayTimeZone,
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
    .toISOString()
    .replace("Z", "")
    .slice(0, 19)
}


function getDisplayYmd(value: string, mode: "kyiv" | "local") {
  const d = parseUtcDateTime(value)
  return mode === "kyiv" ? kyivYmd(d) : localYmd(d)
}


function getOfficeDateForSelectedDate(
  selectedDate: string,
  mode: "kyiv" | "local"
) {
  if (!isYmd(selectedDate)) return selectedDate
  if (mode === "kyiv") return selectedDate

  const localMiddayUtc = toUTC(selectedDate, "12:00", "local")
  return kyivYmd(parseUtcDateTime(localMiddayUtc))
}


function getCalendarDay(calendar: OfficeCalendarDay[], selectedDate: string) {
  return calendar.find((v) => v.date === selectedDate) || null
}

function getEffectiveWorkingHours(
  selectedDate: string,
  officeSettings: OfficeSettings | null,
  officeCalendar: OfficeCalendarDay[]
) {
  if (!officeSettings) {
    return {
      closed: false,
      start: "",
      end: "",
    }
  }

  const day = getCalendarDay(officeCalendar, selectedDate)

  if (day && Number(day.is_working_day) === 0) {
    return {
      closed: true,
      start: "",
      end: "",
    }
  }

  return {
    closed: false,
    start: day?.working_start || officeSettings.working_day_start,
    end: day?.working_end || officeSettings.working_day_end,
  }
}



export const getTimes = (
  mode: "kyiv" | "local",
  settings: OfficeSettings | null,
  selectedDate?: string
) => {
  if (!settings) return []

  const slot = Number(settings.slot_minutes)
  if (!slot || !isHm(settings.working_day_start) || !isHm(settings.working_day_end)) {
    return []
  }

  const list: string[] = []

  for (
    let m = mins(settings.working_day_start);
    m <= mins(settings.working_day_end);
    m += slot
  ) {
    list.push(minutesToTime(m))
  }

  if (mode === "kyiv") return list

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const anchorDate = selectedDate || kyivYmd(getCurrentUtc("", 0))

  return list.map((t) => {
    const utc = toUTC(anchorDate, t, "kyiv")
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parseUtcDateTime(utc))
  })
}



export const getOfficeBounds = (
  mode: "kyiv" | "local",
  settings: OfficeSettings | null,
  selectedDate?: string
) => {
  if (!settings) {
    return { start: 0, end: 0 }
  }

  const startKyiv = mins(settings.working_day_start)
  const endKyiv = mins(settings.working_day_end)

  if (mode === "kyiv") return { start: startKyiv, end: endKyiv }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const anchorDate = selectedDate || kyivYmd(getCurrentUtc("", 0))

  const startUTC = toUTC(anchorDate, settings.working_day_start, "kyiv")
  const endUTC = toUTC(anchorDate, settings.working_day_end, "kyiv")

  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parseUtcDateTime(startUTC))

  const e = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parseUtcDateTime(endUTC))

  return { start: mins(s), end: mins(e) }
}




const nextSlot = (
  reservations: Reservation[],
  calendar: OfficeCalendarDay[],
  settings: OfficeSettings | null,
  date: string,
  mode: "kyiv" | "local",
  serverNow: string,
  serverReceivedAt: number
) => {
  if (!settings || !isYmd(date)) return ""

  const officeDate = getOfficeDateForSelectedDate(date, mode)
  const dayMeta = getEffectiveWorkingHours(officeDate, settings, calendar)

  if (dayMeta.closed) return ""
  if (!isHm(dayMeta.start) || !isHm(dayMeta.end)) return ""

  const tz =
    mode === "kyiv"
      ? "Europe/Kyiv"
      : Intl.DateTimeFormat().resolvedOptions().timeZone

  const dayStartUTC = toUTC(officeDate, dayMeta.start, "kyiv")
  const dayEndUTC = toUTC(officeDate, dayMeta.end, "kyiv")

  const dayStart =
    mode === "kyiv"
      ? mins(dayMeta.start)
      : mins(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(parseUtcDateTime(dayStartUTC))
        )

  const dayEnd =
    mode === "kyiv"
      ? mins(dayMeta.end)
      : mins(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(parseUtcDateTime(dayEndUTC))
        )

  const nowUTC = getCurrentUtc(serverNow, serverReceivedAt)

  const today = mode === "kyiv" ? kyivYmd(nowUTC) : localYmd(nowUTC)

  let slot = dayStart

  if (date === today) {
    const current =
      mode === "kyiv"
        ? mins(kyivHm(nowUTC))
        : mins(
            new Intl.DateTimeFormat("en-GB", {
              timeZone: tz,
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }).format(nowUTC)
          )

    const slotSize = Number(settings.slot_minutes || settings.min_booking_minutes)

    if (!slotSize) return ""

    slot = Math.max(dayStart, Math.ceil(current / slotSize) * slotSize)
  }

  const busy = reservations
    .filter((r) => {
      const rOfficeDate = getOfficeDateForSelectedDate(
        getDisplayYmd(r.start_at, mode),
        mode
      )
      return rOfficeDate === officeDate && r.status !== "cancelled"
    })
    .map((r) => ({
      s: mins(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(parseUtcDateTime(r.start_at))
      ),
      e: mins(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(parseUtcDateTime(r.end_at))
      ),
    }))
    .sort((a, b) => a.s - b.s)

  while (slot < dayEnd) {
    const clash = busy.find((v) => slot >= v.s && slot < v.e)
    if (!clash) return minutesToTime(slot)
    slot = clash.e
  }

  return ""
}



export function useAppData() {
  const [token, setToken] = useState(localStorage.getItem("token") || "")
  const [status, setStatus] = useState<AppStatus>("booting")
  const [appError, setAppError] = useState("")

  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [officeSettings, setOfficeSettings] = useState<OfficeSettings | null>(null)
  const [officeCalendar, setOfficeCalendar] = useState<OfficeCalendarDay[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [myReservations, setMyReservations] = useState<Reservation[]>([])

  const [showCurrent, setShowCurrent] = useState(false)
  const [showPast, setShowPast] = useState(false)

  const [time, setTime] = useState("")
  const [localTime, setLocalTime] = useState("")
  const [serverNow, setServerNow] = useState("")
  const [serverReceivedAt, setServerReceivedAt] = useState(0)

  const [selectedDate, setSelectedDate] = useState("")

  const [timeMode, setTimeMode] = useState<"kyiv" | "local">(
    localStorage.getItem("timeMode") === "local" ? "local" : "kyiv"
  )

  const todayDate = useMemo(
    () => getTodayYmd(timeMode, serverNow, serverReceivedAt),
    [timeMode, serverNow, serverReceivedAt]
  )

  const nowUtcMs = useMemo(
    () => getCurrentUtc(serverNow, serverReceivedAt).getTime(),
    [serverNow, serverReceivedAt]
  )

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showModal, _setShowModal] = useState(false)

  const [title, setTitle] = useState("")
  const [roomId, setRoomId] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [registerMode, setRegisterMode] = useState(false)

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [profilePassword, setProfilePassword] = useState("")

  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")

  const [reserveError, setReserveError] = useState("")
  const [loginError, setLoginError] = useState("")
  const [registerError, setRegisterError] = useState("")
  const [isReserving, setIsReserving] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)


  function resetAuthForm(opts?: { keepEmail?: boolean }) {
    const keepEmail = !!opts?.keepEmail

    if (!keepEmail) {
      setEmail("")
    }

    setPassword("")
    setName("")
    setLoginError("")
    setRegisterError("")
  }


  useEffect(() => {
    localStorage.setItem("timeMode", timeMode)
  }, [timeMode])

  useEffect(() => {
    const update = () => {
      const now = serverNow
        ? new Date(parseUtcDateTime(serverNow).getTime() + (Date.now() - serverReceivedAt))
        : new Date()

      const kyivText = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Kyiv",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)

      const localText = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)

      setTime((v) => (v === kyivText ? v : kyivText))
      setLocalTime((v) => (v === localText ? v : localText))
    }

    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [serverNow, serverReceivedAt])

  useEffect(() => {
  if (!serverNow || selectedDate) return
  setSelectedDate(getTodayYmd(timeMode, serverNow, serverReceivedAt))
}, [timeMode, serverNow, serverReceivedAt, selectedDate])

  useEffect(() => {
    void initApp()
  }, [])

  useEffect(() => {
    if (status !== "ready" || !token || !selectedDate || !isYmd(selectedDate)) return
    void loadCalendarForDate(selectedDate)
  }, [selectedDate, token, status])

  async function api(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }

    if (token) headers.Authorization = `Bearer ${token}`

    const r = await fetch(`${API}${path}`, { ...options, headers })

    let data: any = null

    try {
      data = await r.json()
    } catch {
      data = { ok: false, error: "Invalid server response" }
    }

    if (!r.ok && data?.ok === undefined) {
      return { ok: false, error: `HTTP ${r.status}` }
    }

    return data
  }

  async function loadServerTime() {
    try {
      const r = await fetch(`${API}/time`)
      const data = await r.json()

      if (data?.ok && data?.utc) {
        setServerNow(String(data.utc).replace("Z", "").slice(0, 19))
        setServerReceivedAt(Date.now())
      }
    } catch {
      const now = new Date()
      setServerNow(now.toISOString().replace("Z", "").slice(0, 19))
      setServerReceivedAt(Date.now())
    }
  }

  async function loadPublicBootstrap() {
    await loadServerTime()

    const settings = await fetch(`${API}/office/settings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .catch(() => null)

    if (settings?.ok && settings?.settings) {
      setOfficeSettings(settings.settings)
      return true
    }

    return false
  }

  async function loadCalendarForDate(date: string) {
    if (!isYmd(date)) return
    const month = date.slice(0, 7)
    const r = await api(`/office/calendar?month=${month}`)
    if (r?.ok && Array.isArray(r.calendar)) {
      setOfficeCalendar(r.calendar)
    }
  }

  async function loadPrivateBootstrap() {
    const me = await api("/auth/me")

    if (!me?.ok || !me.user) {
      localStorage.removeItem("token")
      setToken("")
      setUser(null)
      setRooms([])
      setReservations([])
      setMyReservations([])
      setStatus("guest")
      return false
    }

    setUser(me.user)

    const [roomsRes, reservationsRes, mineRes] = await Promise.all([
      api("/rooms"),
      api("/reservations"),
      api("/my/reservations"),
    ])

    setRooms(Array.isArray(roomsRes) ? roomsRes : [])
    setReservations(Array.isArray(reservationsRes) ? reservationsRes : [])

    if (mineRes?.ok) {
      setMyReservations([...(mineRes.upcoming || []), ...(mineRes.past || [])])
    } else {
      setMyReservations([])
    }

    return true
  }




    async function initApp() {
    setStatus("booting")
    setAppError("")
    setLoginError("")
    setRegisterError("")

    try {
      const publicOk = await loadPublicBootstrap()

      if (!publicOk) {
        setAppError("Unable to load office settings.")
        setStatus("error")
        return
      }

      if (!token) {
        resetAuthForm()
        setRegisterMode(false)
        setStatus("guest")
        return
      }

      const privateOk = await loadPrivateBootstrap()

      if (!privateOk) return

      const initialDate = getTodayYmd(timeMode, serverNow, serverReceivedAt)

      setSelectedDate(initialDate)
      await loadCalendarForDate(initialDate)

      setStatus("ready")
    } catch (e: any) {
      setAppError(e?.message || "Failed to initialize app.")
      setStatus(token ? "error" : "guest")
    }
  }



  const workingHoursText = useMemo(() => {
    if (!officeSettings || !selectedDate || !isYmd(selectedDate)) return ""

    const officeDate = getOfficeDateForSelectedDate(selectedDate, timeMode)
    const dayMeta = getEffectiveWorkingHours(officeDate, officeSettings, officeCalendar)

    if (dayMeta.closed) return "Closed"
    if (!dayMeta.start || !dayMeta.end) return ""

    if (timeMode === "kyiv") return `${dayMeta.start} - ${dayMeta.end}`

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

    const sUTC = toUTC(officeDate, dayMeta.start, "kyiv")
    const eUTC = toUTC(officeDate, dayMeta.end, "kyiv")

    const s = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parseUtcDateTime(sUTC))

    const e = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parseUtcDateTime(eUTC))

    return `${s} - ${e}`
  }, [officeSettings, officeCalendar, selectedDate, timeMode])

  const currentReservations = useMemo(
    () =>
      myReservations.filter(
        (r) => r.status !== "cancelled" && parseUtcDateTime(r.end_at).getTime() > nowUtcMs
      ),
    [myReservations, nowUtcMs]
  )

  const pastReservations = useMemo(
    () =>
      myReservations.filter(
        (r) => r.status === "cancelled" || parseUtcDateTime(r.end_at).getTime() <= nowUtcMs
      ),
    [myReservations, nowUtcMs]
  )

  const setShowModal = (v: boolean) => {
    if (v) {
      if (!officeSettings) {
        setReserveError("Office settings not loaded.")
        return
      }

      if (!selectedDate || !isYmd(selectedDate)) {
        setReserveError("Invalid selected date.")
        return
      }

        const s = nextSlot(
        reservations,
        officeCalendar,
        officeSettings,
        selectedDate,
        timeMode,
        serverNow,
        serverReceivedAt
      )

      if (!editing) {
        const officeDate = getOfficeDateForSelectedDate(selectedDate, timeMode)
        const dayMeta = getEffectiveWorkingHours(officeDate, officeSettings, officeCalendar)

const fallbackStart =
  timeMode === "kyiv"
    ? dayMeta.start
    : getTimes(
        timeMode,
        {
          ...officeSettings,
          working_day_start: dayMeta.start,
          working_day_end: dayMeta.end,
        },
        selectedDate
      )[0] || ""


        const initialStart = s || fallbackStart

        setStart(initialStart)

        const slot = Number(
          officeSettings.slot_minutes ?? officeSettings.min_booking_minutes ?? 30
        )

        setEnd(initialStart ? minutesToTime(mins(initialStart) + slot) : "")
        setReserveError(
          s
            ? ""
            : "No available time slots for this day. You can review the schedule, but booking is unavailable."
        )
      }


    } else {
      setEditing(false)
      setEditingId(null)
      setReserveError("")
    }

    _setShowModal(v)
  }




    async function login() {
    setLoginError("")
    setRegisterError("")

    const r = await api("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!r?.ok) {
      setLoginError(r?.error || "Login failed")
      return
    }

    localStorage.setItem("token", r.token)
    setToken(r.token)

    const oldToken = token
    const nextToken = r.token

    try {
      setStatus("booting")

      const me = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${nextToken}` },
      }).then((res) => res.json())

      if (!me?.ok || !me.user) {
        localStorage.removeItem("token")
        setToken(oldToken)
        setLoginError("Unable to load user session")
        setStatus("guest")
        return
      }

      setUser(me.user)

      const [roomsRes, reservationsRes, settingsRes, mineRes] = await Promise.all([
        fetch(`${API}/rooms`, { headers: { Authorization: `Bearer ${nextToken}` } }).then((r) =>
          r.json()
        ),
        fetch(`${API}/reservations`, {
          headers: { Authorization: `Bearer ${nextToken}` },
        }).then((r) => r.json()),
        fetch(`${API}/office/settings`, {
          headers: { Authorization: `Bearer ${nextToken}` },
        }).then((r) => r.json()),
        fetch(`${API}/my/reservations`, {
          headers: { Authorization: `Bearer ${nextToken}` },
        }).then((r) => r.json()),
      ])

      setRooms(Array.isArray(roomsRes) ? roomsRes : [])
      setReservations(Array.isArray(reservationsRes) ? reservationsRes : [])

      if (settingsRes?.ok && settingsRes?.settings) {
        setOfficeSettings(settingsRes.settings)
      }

      setMyReservations([...(mineRes?.upcoming || []), ...(mineRes?.past || [])])

      const activeDate = getTodayYmd(timeMode, serverNow, serverReceivedAt)

      setSelectedDate(activeDate)

      const month = activeDate.slice(0, 7)
      const calendarRes = await fetch(`${API}/office/calendar?month=${month}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
      }).then((r) => r.json())

      if (calendarRes?.ok && Array.isArray(calendarRes.calendar)) {
        setOfficeCalendar(calendarRes.calendar)
      }

      resetAuthForm()
      setRegisterMode(false)
      setStatus("ready")
    } catch {
      setLoginError("Login succeeded, but app bootstrap failed")
      setStatus("error")
    }
  }



    async function register() {
    setRegisterError("")
    setLoginError("")

    if (!name.trim()) {
      setRegisterError("Name is required")
      return
    }

    const minPassword = Number(officeSettings?.min_password_length ?? 8)
    const maxPassword = Number(officeSettings?.max_password_length ?? 72)

    if (password.length < minPassword || password.length > maxPassword) {
      setRegisterError(`Password must be ${minPassword}-${maxPassword} characters`)
      return
    }

    const r = await api("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    if (!r?.ok) {
      setRegisterError(r?.error || "Registration failed")
      return
    }

    setRegisterMode(false)
    resetAuthForm({ keepEmail: true })
  }



    async function logout() {
    try {
      await api("/auth/logout", { method: "POST" })
    } catch {}

    localStorage.removeItem("token")
    setToken("")
    resetAuthForm()
    setRegisterMode(false)

    setUser(null)
    setRooms([])
    setReservations([])
    setMyReservations([])
    setOfficeCalendar([])
    setShowCurrent(false)
    setShowPast(false)
    setSelectedRoom(null)
    setShowProfileModal(false)
    _setShowModal(false)
    setStatus("guest")
  }


  function openProfile() {
    if (!user) return

    setProfileName(user.name)
    setProfileEmail(user.email)
    setProfilePassword("")
    setProfileError("")
    setProfileSuccess("")
    setShowProfileModal(true)
  }

  async function updateProfile() {
    setProfileError("")
    setProfileSuccess("")

    if (!profileName.trim()) {
      setProfileError("Name required")
      return
    }

    const minPassword = Number(officeSettings?.min_password_length ?? 8)
    const maxPassword = Number(officeSettings?.max_password_length ?? 72)

    if (
      profilePassword &&
      (profilePassword.length < minPassword || profilePassword.length > maxPassword)
    ) {
      setProfileError(`Password must be ${minPassword}-${maxPassword} characters`)
      return
    }

    const r = await api("/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: profileName.trim(),
        email: profileEmail.trim(),
        password: profilePassword,
      }),
    })

    if (!r?.ok) {
      setProfileError(r?.error || "Update failed")
      return
    }

    setUser(r.user)
    setProfileSuccess("Profile updated")
    setProfilePassword("")
  }

  async function editReservation(id: number) {
    setReserveError("")
    const r = myReservations.find((v) => v.id === id)
    if (!r) return

    setEditing(true)
    setEditingId(id)

    setTitle(r.title)
    setRoomId(String(r.room_id))
    setStart(fromUTC(r.start_at, timeMode))
    setEnd(fromUTC(r.end_at, timeMode))
    _setShowModal(true)
  }

  async function deleteReservation(id: number) {
    if (!confirm("Cancel reservation?")) return
    await api(`/reservations/${id}`, { method: "DELETE" })
    await initApp()
  }

  async function reserveRoom() {
    setReserveError("")

    if (!selectedDate || !isYmd(selectedDate)) {
      setReserveError("Invalid selected date.")
      return
    }

    if (!officeSettings) {
      setReserveError("Office settings not loaded.")
      return
    }

    if (editing && editingId !== null) {
      const r = await api(`/reservations/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: Number(roomId),
          title: title.trim(),
          description: "",
          start_at: toUTC(selectedDate, start, timeMode),
          end_at: toUTC(selectedDate, end, timeMode),
        }),
      })

      if (!r?.ok) {
        setReserveError(r?.error || "Update failed.")
        return
      }

      setEditing(false)
      setEditingId(null)
      setShowModal(false)
      await initApp()
      return
    }

    if (isReserving) return

    const clean = title.trim()

    if (!clean) {
      setReserveError("Meeting title is required.")
      return
    }

    const minTitle = Number(officeSettings.min_title_length)
    const maxTitle = Number(officeSettings.max_title_length)

    if (clean.length < minTitle || clean.length > maxTitle) {
      setReserveError(`Title must be ${minTitle}-${maxTitle} characters.`)
      return
    }

    if (!roomId) {
      setReserveError("Please select a room.")
      return
    }

    const s = mins(start)
    const e = mins(end)
    const duration = e - s

    const minBooking = Number(officeSettings.min_booking_minutes)
    const maxBooking = Number(officeSettings.max_booking_minutes)

    if (duration <= 0) {
      setReserveError("End time must be after start time.")
      return
    }

    if (duration < minBooking) {
      setReserveError(`Minimum duration is ${minBooking} minutes.`)
      return
    }

    if (duration > maxBooking) {
      setReserveError(`Maximum duration is ${maxBooking} minutes.`)
      return
    }

    const officeDate = getOfficeDateForSelectedDate(selectedDate, timeMode)
    const dayMeta = getEffectiveWorkingHours(officeDate, officeSettings, officeCalendar)

    if (dayMeta.closed) {
      setReserveError("Office is closed on selected day.")
      return
    }

    const effectiveBounds =
  timeMode === "kyiv"
    ? { start: mins(dayMeta.start), end: mins(dayMeta.end) }
    : getOfficeBounds(
        timeMode,
        {
          ...officeSettings,
          working_day_start: dayMeta.start,
          working_day_end: dayMeta.end,
        },
        selectedDate
      )

    if (!isWithinWorkingBounds(s, e, effectiveBounds.start, effectiveBounds.end)) {
      setReserveError(`Working hours are ${workingHoursText}.`)
      return
    }

    const selectedUTC = parseUtcDateTime(toUTC(selectedDate, start, timeMode))
    const nowUTC = getCurrentUtc(serverNow, serverReceivedAt)

    if (selectedUTC <= nowUTC) {
      setReserveError("Cannot reserve past time.")
      return
    }

    setIsReserving(true)

    const r = await api("/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: Number(roomId),
        title: clean,
        description: "",
        start_at: toUTC(selectedDate, start, timeMode),
        end_at: toUTC(selectedDate, end, timeMode),
      }),
    })

    setIsReserving(false)

    if (!r?.ok) {
      setReserveError(r?.error || "Slot is unavailable.")
      return
    }

    setShowModal(false)
    setTitle("")
    setRoomId("")

    const firstSlot = dayMeta.start || officeSettings.working_day_start
    const slot = Number(officeSettings.slot_minutes ?? officeSettings.min_booking_minutes)

    setStart(firstSlot)
    setEnd(minutesToTime(mins(firstSlot) + slot))
    setEditing(false)
    setEditingId(null)

    await initApp()
  }

  const formatDate = (v: string) => {
    if (!isYmd(v)) return v
    const d = utcDateFromYmd(v)
    return new Intl.DateTimeFormat("en-GB", {
      timeZone:
        timeMode === "kyiv"
          ? "Europe/Kyiv"
          : Intl.DateTimeFormat().resolvedOptions().timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d)
  }

  const formatWeekdayShort = (v: string) => {
    if (!isYmd(v)) return v
    const d = utcDateFromYmd(v)
    return new Intl.DateTimeFormat("en-GB", {
      timeZone:
        timeMode === "kyiv"
          ? "Europe/Kyiv"
          : Intl.DateTimeFormat().resolvedOptions().timeZone,
      weekday: "short",
    }).format(d)
  }

  const formatDayNumber = (v: string) => {
    if (!isYmd(v)) return v
    const d = utcDateFromYmd(v)
    return new Intl.DateTimeFormat("en-GB", {
      timeZone:
        timeMode === "kyiv"
          ? "Europe/Kyiv"
          : Intl.DateTimeFormat().resolvedOptions().timeZone,
      day: "2-digit",
    }).format(d)
  }

  const formatDateTime = (v: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone:
        timeMode === "kyiv"
          ? "Europe/Kyiv"
          : Intl.DateTimeFormat().resolvedOptions().timeZone,
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parseUtcDateTime(v))

  return {
    status,
    appError,

    token,
    user,
    rooms,
    reservations,

    showCurrent,
    setShowCurrent,
    showPast,
    setShowPast,

    time,
    localTime,
    serverNow,
    serverReceivedAt,
    nowUtcMs,

    selectedDate,
    setSelectedDate,

    selectedRoom,
    setSelectedRoom,

    showModal,
    setShowModal,

    title,
    setTitle,
    roomId,
    setRoomId,
    start,
    setStart,
    end,
    setEnd,

    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    registerMode,
    setRegisterMode,
    resetAuthForm,

    reserveError,
    loginError,
    registerError,
    isReserving,
    editing,

    currentReservations,
    pastReservations,

    login,
    register,
    logout,

    openProfile,
    showProfileModal,
    setShowProfileModal,

    profileName,
    setProfileName,
    profileEmail,
    setProfileEmail,
    profilePassword,
    setProfilePassword,
    profileError,
    profileSuccess,
    updateProfile,

    editReservation,
    deleteReservation,
    reserveRoom,

    formatDate,
    formatDateTime,
    workingHoursText,

    todayDate,
    formatWeekdayShort,
    formatDayNumber,

    timeMode,
    setTimeMode,

TIMES: getTimes(timeMode, officeSettings, selectedDate),
getTimes: (mode: "kyiv" | "local") => getTimes(mode, officeSettings, selectedDate),

    officeSettings,
    officeCalendar,
  }
}
