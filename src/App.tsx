import { useEffect, useState } from "react"
import "./App.css"

type Room = {
  name: string
  floor: number
  capacity: number
  status: string
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

    const time = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    setCurrentTime(time)
  }

  function loadRooms() {
    setRooms([
      { name: "Alpha", floor: 1, capacity: 6, status: "available" },
      { name: "Bravo", floor: 1, capacity: 8, status: "reserved" },
      { name: "Charlie", floor: 2, capacity: 4, status: "meeting" },
      { name: "Delta", floor: 2, capacity: 10, status: "available" },
      { name: "Echo", floor: 3, capacity: 12, status: "available" },
      { name: "Foxtrot", floor: 3, capacity: 16, status: "available" },
    ])
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
          <span>09:00 - 19:00</span>
        </div>

        <div className="info">
          <span>Total Rooms</span>
          <span>{rooms.length}</span>
        </div>
      </div>

      <div className="card">
        <h2>Today's Reservations</h2>

        <div className="small">
          No reservations today.
        </div>
      </div>

      {rooms.map((room) => (
        <div className="room-card" key={room.name}>
          <div className="room-head">
            <div className="room-name">
              {room.name} • Floor {room.floor} • 👥{room.capacity}
            </div>

            <div className={`status ${room.status}`}>
              {room.status === "available" && "Available"}
              {room.status === "reserved" && "Reserved"}
              {room.status === "meeting" && "In Meeting"}
            </div>
          </div>

          <div className="timeline">
            <div className="t tf"></div>
            <div className="t tf"></div>
            <div className="t tr"></div>
            <div className="t tm"></div>
            <div className="t tf"></div>
            <div className="t tf"></div>
          </div>

          <div className="desc">
            Meeting room on floor {room.floor}.
          </div>
        </div>
      ))}

      <div className="footer">
        RoomZalazer • React + TypeScript + Cloudflare
      </div>
    </div>
  )
}

export default App
