import { useEffect, useMemo, useState } from "react"
import type { OfficeCalendarDay, OfficeSettings } from "../hooks/useAppData"

type Props = {
  open: boolean
  onClose: () => void

  officeSettings: OfficeSettings | null
  officeCalendar: OfficeCalendarDay[]
  selectedDate: string

  adminSettingsError: string
  adminSettingsSuccess: string
  isSavingAdminSettings: boolean

  updateOfficeSettings: (payload: Partial<OfficeSettings>) => Promise<{ ok: true } | { ok: false; error: string }>
  upsertOfficeCalendarDay: (payload: OfficeCalendarDay) => Promise<{ ok: true } | { ok: false; error: string }>
  deleteOfficeCalendarDay: (date: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

const isYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)

const normalizeTime = (v: unknown) => String(v ?? "").trim().slice(0, 5)

const toBoolNumber = (v: unknown) => (Number(v) ? 1 : 0)

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 40,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
  background: "var(--input-bg, transparent)",
  color: "inherit",
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
}

const sectionCardStyle: React.CSSProperties = {
  border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
  borderRadius: 14,
  padding: 16,
}

export default function AdminSettingsModal({
  open,
  onClose,

  officeSettings,
  officeCalendar,
  selectedDate,

  adminSettingsError,
  adminSettingsSuccess,
  isSavingAdminSettings,

  updateOfficeSettings,
  upsertOfficeCalendarDay,
  deleteOfficeCalendarDay,
}: Props) {
  const [settingsForm, setSettingsForm] = useState({
    office_timezone: "Europe/Kyiv",
    working_day_start: "09:00",
    working_day_end: "18:00",
    slot_minutes: 30,
    max_booking_minutes: 120,
    notify_before_minutes: 15,
    min_password_length: 8,
    max_password_length: 64,
    min_title_length: 3,
    max_title_length: 120,
    max_description_length: 1000,
    min_booking_minutes: 30,
    max_future_booking_days: 60,
    allow_weekend_booking: 0,
  })

  const [dayForm, setDayForm] = useState({
    date: "",
    is_working_day: 1,
    working_start: "09:00",
    working_end: "18:00",
    title: "",
  })

  const selectedDayOverride = useMemo(() => {
    if (!isYmd(selectedDate)) return null
    return officeCalendar.find((x) => x.date === selectedDate) || null
  }, [officeCalendar, selectedDate])

  useEffect(() => {
    if (!open || !officeSettings) return

    setSettingsForm({
      office_timezone: String(officeSettings.office_timezone || "Europe/Kyiv"),
      working_day_start: normalizeTime(officeSettings.working_day_start || "09:00"),
      working_day_end: normalizeTime(officeSettings.working_day_end || "18:00"),
      slot_minutes: Number(officeSettings.slot_minutes || 30),
      max_booking_minutes: Number(officeSettings.max_booking_minutes || 120),
      notify_before_minutes: Number(officeSettings.notify_before_minutes || 15),
      min_password_length: Number(officeSettings.min_password_length || 8),
      max_password_length: Number(officeSettings.max_password_length || 64),
      min_title_length: Number(officeSettings.min_title_length || 3),
      max_title_length: Number(officeSettings.max_title_length || 120),
      max_description_length: Number(officeSettings.max_description_length || 1000),
      min_booking_minutes: Number(officeSettings.min_booking_minutes || 30),
      max_future_booking_days: Number(officeSettings.max_future_booking_days || 60),
      allow_weekend_booking: toBoolNumber(officeSettings.allow_weekend_booking),
    })
  }, [open, officeSettings])

  useEffect(() => {
    if (!open) return

    if (selectedDayOverride) {
      setDayForm({
        date: String(selectedDayOverride.date || selectedDate || ""),
        is_working_day: toBoolNumber(selectedDayOverride.is_working_day),
        working_start: normalizeTime(selectedDayOverride.working_start || "09:00"),
        working_end: normalizeTime(selectedDayOverride.working_end || "18:00"),
        title: String(selectedDayOverride.title || ""),
      })
      return
    }

    setDayForm({
      date: isYmd(selectedDate) ? selectedDate : "",
      is_working_day: 1,
      working_start: normalizeTime(officeSettings?.working_day_start || "09:00"),
      working_end: normalizeTime(officeSettings?.working_day_end || "18:00"),
      title: "",
    })
  }, [open, selectedDate, selectedDayOverride, officeSettings])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("keydown", onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !officeSettings) return null

  const onSettingsNumber =
    (key: keyof typeof settingsForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      setSettingsForm((s) => ({
        ...s,
        [key]: Number.isFinite(value) ? value : 0,
      }))
    }

  const onSettingsText =
    (key: keyof typeof settingsForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSettingsForm((s) => ({
        ...s,
        [key]: e.target.value,
      }))
    }

  const onDayText =
    (key: keyof typeof dayForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDayForm((s) => ({
        ...s,
        [key]: e.target.value,
      }))
    }

  async function handleSaveSettings() {
    await updateOfficeSettings({
      office_timezone: String(settingsForm.office_timezone).trim(),
      working_day_start: normalizeTime(settingsForm.working_day_start),
      working_day_end: normalizeTime(settingsForm.working_day_end),
      slot_minutes: Number(settingsForm.slot_minutes),
      max_booking_minutes: Number(settingsForm.max_booking_minutes),
      notify_before_minutes: Number(settingsForm.notify_before_minutes),
      min_password_length: Number(settingsForm.min_password_length),
      max_password_length: Number(settingsForm.max_password_length),
      min_title_length: Number(settingsForm.min_title_length),
      max_title_length: Number(settingsForm.max_title_length),
      max_description_length: Number(settingsForm.max_description_length),
      min_booking_minutes: Number(settingsForm.min_booking_minutes),
      max_future_booking_days: Number(settingsForm.max_future_booking_days),
      allow_weekend_booking: Number(settingsForm.allow_weekend_booking) ? 1 : 0,
    })
  }

  async function handleSaveDay() {
    await upsertOfficeCalendarDay({
      date: String(dayForm.date).trim(),
      is_working_day: Number(dayForm.is_working_day) ? 1 : 0,
      working_start: Number(dayForm.is_working_day) ? normalizeTime(dayForm.working_start) : null,
      working_end: Number(dayForm.is_working_day) ? normalizeTime(dayForm.working_end) : null,
      title: String(dayForm.title || "").trim(),
    })
  }

  async function handleDeleteDay() {
    const date = String(dayForm.date || "").trim()
    if (!isYmd(date)) return
    await deleteOfficeCalendarDay(date)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin settings"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(980px, 100%)",
          maxHeight: "calc(100vh - 32px)",
          overflow: "auto",
          margin: 0,
          padding: 20,
          borderRadius: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div className="section-title">Admin settings</div>
            <div className="small" style={{ marginTop: 6 }}>
              Update global office rules and calendar override for the selected date.
            </div>
          </div>

          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        {(adminSettingsError || adminSettingsSuccess) && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: adminSettingsError
                ? "rgba(220, 38, 38, 0.12)"
                : "rgba(16, 185, 129, 0.12)",
              color: "inherit",
            }}
          >
            {adminSettingsError || adminSettingsSuccess}
          </div>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          <div style={sectionCardStyle}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              Office settings
            </div>

            <div style={gridStyle}>
              <label style={labelStyle}>
                <span className="small">Office timezone</span>
                <input
                  style={inputStyle}
                  value={settingsForm.office_timezone}
                  onChange={onSettingsText("office_timezone")}
                  placeholder="Europe/Kyiv"
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Working day start</span>
                <input
                  style={inputStyle}
                  type="time"
                  value={settingsForm.working_day_start}
                  onChange={onSettingsText("working_day_start")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Working day end</span>
                <input
                  style={inputStyle}
                  type="time"
                  value={settingsForm.working_day_end}
                  onChange={onSettingsText("working_day_end")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Slot minutes</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={5}
                  step={5}
                  value={settingsForm.slot_minutes}
                  onChange={onSettingsNumber("slot_minutes")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Min booking minutes</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={5}
                  step={5}
                  value={settingsForm.min_booking_minutes}
                  onChange={onSettingsNumber("min_booking_minutes")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Max booking minutes</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={5}
                  step={5}
                  value={settingsForm.max_booking_minutes}
                  onChange={onSettingsNumber("max_booking_minutes")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Notify before minutes</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  step={5}
                  value={settingsForm.notify_before_minutes}
                  onChange={onSettingsNumber("notify_before_minutes")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Max future booking days</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  step={1}
                  value={settingsForm.max_future_booking_days}
                  onChange={onSettingsNumber("max_future_booking_days")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Min password length</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  step={1}
                  value={settingsForm.min_password_length}
                  onChange={onSettingsNumber("min_password_length")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Max password length</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  step={1}
                  value={settingsForm.max_password_length}
                  onChange={onSettingsNumber("max_password_length")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Min title length</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  step={1}
                  value={settingsForm.min_title_length}
                  onChange={onSettingsNumber("min_title_length")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Max title length</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  step={1}
                  value={settingsForm.max_title_length}
                  onChange={onSettingsNumber("max_title_length")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Max description length</span>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  step={1}
                  value={settingsForm.max_description_length}
                  onChange={onSettingsNumber("max_description_length")}
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 40,
                  alignSelf: "end",
                }}
              >
                <input
                  type="checkbox"
                  checked={Number(settingsForm.allow_weekend_booking) === 1}
                  onChange={(e) =>
                    setSettingsForm((s) => ({
                      ...s,
                      allow_weekend_booking: e.target.checked ? 1 : 0,
                    }))
                  }
                />
                <span className="small">Allow weekend booking</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn primary"
                onClick={handleSaveSettings}
                disabled={isSavingAdminSettings}
              >
                {isSavingAdminSettings ? "Saving..." : "Save office settings"}
              </button>
            </div>
          </div>

          <div style={sectionCardStyle}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              Calendar override
            </div>

            <div style={gridStyle}>
              <label style={labelStyle}>
                <span className="small">Date</span>
                <input
                  style={inputStyle}
                  type="date"
                  value={dayForm.date}
                  onChange={onDayText("date")}
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 40,
                  alignSelf: "end",
                }}
              >
                <input
                  type="checkbox"
                  checked={Number(dayForm.is_working_day) === 1}
                  onChange={(e) =>
                    setDayForm((s) => ({
                      ...s,
                      is_working_day: e.target.checked ? 1 : 0,
                    }))
                  }
                />
                <span className="small">Working day</span>
              </label>

              <label style={labelStyle}>
                <span className="small">Working start</span>
                <input
                  style={inputStyle}
                  type="time"
                  value={dayForm.working_start}
                  disabled={Number(dayForm.is_working_day) !== 1}
                  onChange={onDayText("working_start")}
                />
              </label>

              <label style={labelStyle}>
                <span className="small">Working end</span>
                <input
                  style={inputStyle}
                  type="time"
                  value={dayForm.working_end}
                  disabled={Number(dayForm.is_working_day) !== 1}
                  onChange={onDayText("working_end")}
                />
              </label>

              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
                <span className="small">Title</span>
                <input
                  style={inputStyle}
                  value={dayForm.title}
                  onChange={onDayText("title")}
                  placeholder="Holiday, maintenance, company event..."
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn primary"
                onClick={handleSaveDay}
                disabled={isSavingAdminSettings}
              >
                {isSavingAdminSettings ? "Saving..." : "Save day override"}
              </button>

              <button
                type="button"
                className="btn"
                onClick={handleDeleteDay}
                disabled={isSavingAdminSettings || !isYmd(dayForm.date)}
              >
                Delete override
              </button>
            </div>

            <div className="small" style={{ marginTop: 12, opacity: 0.8 }}>
              Delete removes only the custom override for that date. Default office settings remain active.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
