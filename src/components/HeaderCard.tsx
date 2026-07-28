type Props={
  time:string
  rooms:number
  reservations:number
}

function HeaderCard({
  time,
  rooms,
  reservations
}:Props){

  return(

    <div className="card">

      <h1>
        RoomZalazer
      </h1>

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
        <span>{rooms}</span>
      </div>

      <div className="info">
        <span>Total Reservations</span>
        <span>{reservations}</span>
      </div>

    </div>

  )

}

export default HeaderCard
