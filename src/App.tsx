import { useEffect, useState } from "react"
import "./App.css"

const API = "https://meeting.shooleeyack.workers.dev"

type Room = {
  id: number
  name: string
  capacity: number
  description: string
}

type Reservation = {
  id: number
  room_id: number
  title: string
  user_name: string
  start_at: string
  end_at: string
}

const USER_NAME = "Guest"

const TIMES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
]

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [time, setTime] = useState("")

  useEffect(() => {
    loadData()

    updateClock()

    const timer = setInterval(() => {
      updateClock()
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  async function loadData() {
    const r1 = await fetch(`${API}/rooms`)
    const r2 = await fetch(`${API}/reservations`)

    setRooms(await r1.json())
    setReservations(await r2.json())
  }

  function updateClock() {
    setTime(
      new Date().toLocaleTimeString("en-GB")
    )
  }

  function myReservations() {
    return reservations.filter(
      (r) => r.user_name === USER_NAME
    )
  }

  function roomReservations(roomId: number) {
    return reservations.filter(
      (r) => r.room_id === roomId
    )
  }

  function timelineClass(
    roomId: number,
    slot: string
  ) {
    const slotMinutes =
      Number(slot.slice(0, 2)) * 60 +
      Number(slot.slice(3, 5))

    for (const reservation of roomReservations(
      roomId
    )) {
      const start = new Date(
        reservation.start_at
      )

      const end = new Date(
        reservation.end_at
      )

      const startMinutes =
        start.getHours() * 60 +
        start.getMinutes()

      const endMinutes =
        end.getHours() * 60 +
        end.getMinutes()

      if (
        slotMinutes >= startMinutes &&
        slotMinutes < endMinutes
      ) {
        return "tr"
      }
    }

    return "tf"
  }

  return (
    <div className="container">
      <div className="card">
        <h1>RoomZalazer</h1>

        <div className="subtitle">
          Smart Meeting Room Reservation Platform
        </div>

        <div className="info">
          <span>Office Time</span>
          <span>{time}</span>
        </div>

        <div className="info">
          <span>Working Hours</span>
          <span>09:00 - 19:00</span>
        </div>

        <div className="info">
          <span>Total Rooms</span>
          <span>{rooms.length}</span>
        </div>

        <div className="info">
          <span>Total Reservations</span>
          <span>{reservations.length}</span>
        </div>
      </div>

      <div className="card">
        <h2>Today's Reservations</h2>

        {myReservations().length === 0 ? (
          <div className="small">
            No reservations today.
          </div>
        ) : (
          myReservations().map((reservation) => (
            <div
              key={reservation.id}
              className="reservation"
            >
              <div className="title">
                {reservation.title}
              </div>

              <div className="small">
                {reservation.start_at.slice(11, 16)}
                {" - "}
                {reservation.end_at.slice(11, 16)}
              </div>
            </div>
          ))
        )}
      </div>

      {rooms.map((room) => (
        <div
          className="room-card"
          key={room.id}
        >
          <div className="room-head">
            <div className="room-name">
              {room.name} 👥{room.capacity}
            </div>

            <div className="status available">
              Available
            </div>
          </div>

          <div className="timeline">
            {TIMES.map((slot) => (
              <div
                key={slot}
                className={`t ${timelineClass(
                  room.id,
                  slot
                )}`}
              />
            ))}
          </div>

          <div className="desc">
            {room.description}
          </div>

          <div className="small">
            Reservations:
            {" "}
            {roomReservations(room.id).length}
          </div>
        </div>
      ))}

      <div className="footer">
        RoomZalazer • Timeline Enabled
      </div>
    </div>
  )
}

export default App
