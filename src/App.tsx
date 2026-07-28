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
  "09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30",
  "13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30",
  "17:00","17:30","18:00","18:30",
]

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] =
    useState<Reservation[]>([])

  const [time, setTime] = useState("")
  const [showModal, setShowModal] =
    useState(false)

  useEffect(() => {
    loadData()

    updateClock()

    const timer = setInterval(
      updateClock,
      1000
    )

    return () => clearInterval(timer)
  }, [])

  async function loadData() {
    const r1 = await fetch(`${API}/rooms`)
    const r2 = await fetch(
      `${API}/reservations`
    )

    setRooms(await r1.json())
    setReservations(await r2.json())
  }

  function updateClock() {
    setTime(
      new Date().toLocaleTimeString(
        "en-GB"
      )
    )
  }

  function roomReservations(id: number) {
    return reservations.filter(
      (r) => r.room_id === id
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

      const s =
        start.getHours() * 60 +
        start.getMinutes()

      const e =
        end.getHours() * 60 +
        end.getMinutes()

      if (
        slotMinutes >= s &&
        slotMinutes < e
      ) {
        return "tr"
      }
    }

    return "tf"
  }

  return (
    <>
      <div className="container">

        <div className="card">
          <h1>RoomZalazer</h1>

          <div className="subtitle">
            Smart Meeting Room
            Reservation Platform
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
            <span>
              {reservations.length}
            </span>
          </div>
        </div>

        <div className="card">
          <h2>Today's Reservations</h2>

          <div className="small">
            No reservations today.
          </div>
        </div>

        {rooms.map((room) => (
          <div
            key={room.id}
            className="room-card"
          >
            <div className="room-head">
              <div className="room-name">
                {room.name}
                {" "}
                👥{room.capacity}
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
          </div>
        ))}

        <div className="footer">
          RoomZalazer • Step 10
        </div>
      </div>

      <button
        className="float"
        onClick={() =>
          setShowModal(true)
        }
      >
        +
      </button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>
              Reserve Meeting Room
            </h2>

            <div className="small">
              Reservation form will
              be added on Step 11.
            </div>

            <div className="modal-buttons">
              <button
                className="secondary"
                onClick={() =>
                  setShowModal(false)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
