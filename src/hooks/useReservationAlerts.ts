import { useEffect, useMemo, useRef } from "react"
import type { Reservation, OfficeSettings } from "../hooks/useAppData"

type NotifyPayload = {
  type: "before_start" | "before_end"
  reservation: Reservation
  minutesLeft: number
}

type Params = {
  reservations: Reservation[]
  myReservationIds?: Set<number>
  nowUtcMs: number
  officeSettings: OfficeSettings | null
  enabled?: boolean
  onNotify?: (payload: NotifyPayload) => void
}

const safeUtcMs = (v?: string | null) => {
  if (!v) return null
  const raw = String(v).trim()
  const d = new Date(raw.endsWith("Z") ? raw : `${raw.replace(" ", "T")}Z`)
  const ms = d.getTime()
  return Number.isNaN(ms) ? null : ms
}

const getReminderMinutes = (officeSettings: OfficeSettings | null) =>
  Number(
    (officeSettings as any)?.reservation_reminder_minutes ??
    (officeSettings as any)?.booking_reminder_minutes ??
    (officeSettings as any)?.notify_before_minutes ??
    10
  ) || 10

export default function useReservationAlerts({
  reservations,
  myReservationIds,
  nowUtcMs,
  officeSettings,
  enabled = true,
  onNotify,
}: Params) {
  const firedRef = useRef<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopTimerRef = useRef<number | null>(null)

  const notifyBeforeStartMinutes = getReminderMinutes(officeSettings)
  const notifyBeforeEndMinutes = getReminderMinutes(officeSettings)

  const myReservations = useMemo(
    () =>
      reservations.filter((r) => {
        if (r.status === "cancelled") return false
        return myReservationIds?.has(r.id) ?? false
      }),
    [reservations, myReservationIds]
  )

  useEffect(() => {
    audioRef.current = new Audio("/sounds/chime.mp3")
    audioRef.current.preload = "auto"

    return () => {
      if (stopTimerRef.current != null) {
        window.clearTimeout(stopTimerRef.current)
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

  const playReservationAlert = () => {
    const audio = audioRef.current ?? new Audio("/sounds/chime.mp3")
    audioRef.current = audio

    if (stopTimerRef.current != null) {
      window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }

    audio.pause()
    audio.currentTime = 0
    audio.loop = false

    audio.play().catch(() => {})

    stopTimerRef.current = window.setTimeout(() => {
      audio.pause()
      audio.currentTime = 0
      stopTimerRef.current = null
    }, 10000)
  }

  useEffect(() => {
    if (!enabled) return

    const activeKeys = new Set<string>()

    for (const reservation of myReservations) {
      const startMs = safeUtcMs(reservation.start_at)
      const endMs = safeUtcMs(reservation.end_at)

      if (startMs == null || endMs == null) continue

      const startReminderAt = startMs - notifyBeforeStartMinutes * 60_000
      const endReminderAt = endMs - notifyBeforeEndMinutes * 60_000

      const startKey = `start-${reservation.id}-${startReminderAt}`
      const endKey = `end-${reservation.id}-${endReminderAt}`

      if (endMs > nowUtcMs) activeKeys.add(startKey)
      if (endMs > nowUtcMs) activeKeys.add(endKey)

      if (
        nowUtcMs >= startReminderAt &&
        nowUtcMs < startMs &&
        !firedRef.current.has(startKey)
      ) {
        firedRef.current.add(startKey)
        playReservationAlert()
        onNotify?.({
          type: "before_start",
          reservation,
          minutesLeft: notifyBeforeStartMinutes,
        })
      }

      if (
        nowUtcMs >= endReminderAt &&
        nowUtcMs < endMs &&
        !firedRef.current.has(endKey)
      ) {
        firedRef.current.add(endKey)
        playReservationAlert()
        onNotify?.({
          type: "before_end",
          reservation,
          minutesLeft: notifyBeforeEndMinutes,
        })
      }
    }

    for (const key of Array.from(firedRef.current)) {
      if (!activeKeys.has(key)) {
        firedRef.current.delete(key)
      }
    }
  }, [
    enabled,
    myReservations,
    nowUtcMs,
    notifyBeforeStartMinutes,
    notifyBeforeEndMinutes,
    onNotify,
  ])
}
