import Timeline from "./Timeline"

type Reservation = {
  id:number
  room_id:number
  title:string
  user_name:string
  start_at:string
  end_at:string
}

type Room = {
  id:number
  name:string
  capacity:number
  description:string
}

type Props = {
  room:Room
  reservations:Reservation[]
}

export default function RoomCard({
  room,
  reservations
}:Props){

  return(
    <div className="room-card">

      <div className="room-head">

        <div className="room-name">
          {room.name} 👥{room.capacity}
        </div>

        <div className="status available">
          Available
        </div>

      </div>

      <Timeline
        roomId={room.id}
        reservations={reservations}
      />

      <div className="desc">
        {room.description}
      </div>

      <div className="small">
        Reservations:
        {" "}
        {
          reservations.filter(
            r=>r.room_id===room.id
          ).length
        }
      </div>

    </div>
  )
}
