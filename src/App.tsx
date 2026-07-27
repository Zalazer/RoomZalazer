import "./App.css"

function App() {
  return (
    <div className="container">

      <div className="card">
        <h1>RoomZalazer</h1>

        <div className="subtitle">
          Smart Meeting Room Reservation System
        </div>

        <div className="info">
          <span>Current time</span>
          <span>12:00</span>
        </div>

        <div className="info">
          <span>Available now</span>
          <span>7</span>
        </div>

        <div className="info">
          <span>Nearest available room</span>
          <span>Alpha</span>
        </div>
      </div>

      <div className="card">
        <h2>Today's Reservations</h2>

        <div className="reservation">
          <div className="title">
            Demo Meeting
          </div>

          <div className="small">
            Alpha • 10:00 - 11:00
          </div>
        </div>
      </div>

      <div className="room-card">

        <div className="room-head">

          <div className="room-name">
            Alpha 👥6
          </div>

          <div className="status available">
            Available now
          </div>

        </div>

        <div className="timeline">
          <div className="t tf"></div>
          <div className="t tf"></div>
          <div className="t tr"></div>
          <div className="t tm"></div>
          <div className="t ty"></div>
          <div className="t tym"></div>
        </div>

        <div className="desc">
          Free for the rest of the day.
        </div>

      </div>

      <div className="footer">
        RoomZalazer • React + TypeScript
      </div>

    </div>
  )
}

export default App
