type Reservation={
  id:number
  room_id:number
  room_name?:string
  title:string
  start_at:string
  end_at:string
  status?:string
}

type Props={
  reservations:Reservation[]
  onDelete:(id:number)=>void
}

export default function ReservationList({
  reservations,
  onDelete
}:Props){

  return(
    <div className="card">

      <h2>My Reservations</h2>

      {reservations.length===0 ? (

        <div className="small">
          No reservations.
        </div>

      ) : (

        reservations.map(r=>(

          <div
            key={r.id}
            className="reservation"
          >

            <div className="title">
              {r.title}
            </div>

            <div className="small">
              {r.room_name ?? `Room #${r.room_id}`}
            </div>

            <div className="small">
              {new Date(r.start_at).toLocaleString()}
            </div>

            <div className="small">
              {new Date(r.end_at).toLocaleString()}
            </div>

            <div className="small">
              {r.status ?? "reserved"}
            </div>

            <div className="actions">
              <button
                className="secondary"
                onClick={() => onDelete(r.id)}
              >
                Cancel
              </button>
            </div>

          </div>

        ))

      )}

    </div>
  )
}
