type Reservation = {
  id: number
  room_id: number
  title: string
  user_name: string
  start_at: string
  end_at: string
}

type Props = {
  reservations: Reservation[]
  userName: string
}

function ReservationList({
  reservations,
  userName,
}: Props) {
  const myReservations = reservations.filter(
    (r) => r.user_name === userName
  )

  return (
    <div className="card">
      <h2>Today's Reservations</h2>

      {myReservations.length === 0 ? (
        <div className="small">
          No reservations today.
        </div>
      ) : (
        myReservations.map((reservation) => (
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
  )
}

export default ReservationList
