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

const playReservationAlert = () => {
  const audio = new Audio("/sounds/chime.mp3")
  audio.loop = true
  audio.play().catch(() => {})

  window.setTimeout(() => {
    audio.pause()
    audio.currentTime = 0
  }, 10000)
}

export default function useReservationAlerts({
  reservations,
  myReservationIds,
  nowUtcMs,
  officeSettings,
  enabled = true,
  onNotify,
}: Params) {
  const firedRef = useRef<Set<string>>(new Set())

  const notifyBeforeStartMinutes =
    Number(
      (officeSettings as any)?.reservation_reminder_minutes ??
      (officeSettings as any)?.booking_reminder_minutes ??
      10
    ) || 10

  const notifyBeforeEndMinutes = 10

  const myReservations = useMemo(
    () =>
      reservations.filter((r) => {
        if (r.status === "cancelled") return false
        return myReservationIds?.has(r.id) ?? false
      }),
    [reservations, myReservationIds]
  )

  useEffect(() => {
    if (!enabled) return

    for (const reservation of myReservations) {
      const startMs = safeUtcMs(reservation.start_at)
      const endMs = safeUtcMs(reservation.end_at)

      if (startMs == null || endMs == null) continue
      if (endMs <= nowUtcMs) continue

      const startReminderAt = startMs - notifyBeforeStartMinutes * 60_000
      const endReminderAt = endMs - notifyBeforeEndMinutes * 60_000

      const startKey = `start-${reservation.id}-${startReminderAt}`
      const endKey = `end-${reservation.id}-${endReminderAt}`

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
  }, [
    enabled,
    myReservations,
    nowUtcMs,
    notifyBeforeStartMinutes,
    notifyBeforeEndMinutes,
    onNotify,
  ])
}
