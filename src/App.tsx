import { useEffect, useState } from "react"
import "./App.css"

const API = "https://meeting.shooleeyack.workers.dev"

type Reservation = {
  id: number
  room_id: number
  title: string
  user_name: string
  start_at: string
  end_at: string
}

type Room = {
  id: number
  name: string
  capacity: number
  description: string
}

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    loadData()

    updateClock()

    const interval = setInterval(() => {
      updateClock()
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const roomResponse = await fetch(`${API}/rooms`)
    const reservationResponse = await fetch(`${API}/reservations`)

    setRooms(await roomResponse.json())
    setReservations(await reservationResponse.json())
  }

  function updateClock() {
    setCurrentTime(
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    )
  }

  function roomReservations(roomId: number) {
    return reservations.filter((r) => r.room_id === roomId)
  }

  function roomStatus(roomId: number) {
    const now = new Date()

    const active = roomReservations(roomId).find((r) => {
      const start = new Date(r.start_at)
      const end = new Date(r.end_at)

      return now >= start && now <= end
    })

    if (active) {
      return {
        text: "Meeting Now",
        color: "#ffb347",
      }
    }

    return {
      text: "Available",
      color: "#37d76d",
    }
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
          <span>{currentTime}</span>
        </div>

        <div className="info">
          <span>Working Hours</span>
          <span>08:00 - 20:00</span>
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

      {rooms.map((room) => {
        const status = roomStatus(room.id)

        return (
          <div className="room-card" key={room.id}>
            <div className="room-head">
              <div className="room-name">
                {room.name}
              </div>

              <div
                className="status"
                style={{
                  background: status.color,
                  color: "#000",
                }}
              >
                {status.text}
              </div>
            </div>

            <div className="desc">
              {room.description}
            </div>

            <div className="small">
              Capacity: {room.capacity}
            </div>

            <div className="small">
              Reservations:
              {" "}
              {roomReservations(room.id).length}
            </div>
          </div>
        )
      })}

      <div className="footer">
        RoomZalazer • Live Reservations Enabled
      </div>
    </div>
  )
}

export default App
