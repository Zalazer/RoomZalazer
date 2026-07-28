import { useEffect, useState } from "react"
import "./App.css"

const API = "https://meeting.shooleeyack.workers.dev"

type Room = {
  id: number
  name: string
  capacity: number
  description: string
}

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    loadRooms()

    updateClock()

    const interval = setInterval(() => {
      updateClock()
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  function updateClock() {
    const now = new Date()

    setCurrentTime(
      now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    )
  }

  async function loadRooms() {
    try {
      const response = await fetch(`${API}/rooms`)

      const data = await response.json()

      setRooms(data)
    } catch (error) {
      console.error(error)
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
          <span>Total Rooms</span>
          <span>{rooms.length}</span>
        </div>
      </div>

      {rooms.map((room) => (
        <div className="room-card" key={room.id}>
          <div className="room-head">
            <div className="room-name">
              {room.name} 👥{room.capacity}
            </div>

            <div className="status available">
              Available
            </div>
          </div>

          <div className="timeline">
            <div className="t tf"></div>
            <div className="t tf"></div>
            <div className="t tf"></div>
            <div className="t tf"></div>
            <div className="t tf"></div>
            <div className="t tf"></div>
          </div>

          <div className="desc">
            {room.description}
          </div>
        </div>
      ))}

      <div className="footer">
        RoomZalazer • Live API Connected
      </div>
    </div>
  )
}

export default App
