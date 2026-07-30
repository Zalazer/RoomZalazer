import Timeline from "./Timeline"

type Reservation={
id:number
room_id:number
title:string
user_name?:string
start_at:string
end_at:string
}

type Room={
id:number
name:string
capacity:number
description:string
}

type Props={
room:Room
reservations:Reservation[]
selectedDate:string
timeMode:"kyiv"|"local"
onClick:()=>void
}

export default function RoomCard({
room,
reservations,
selectedDate,
timeMode,
onClick
}:Props){

const count=reservations.filter(
r=>r.room_id===room.id&&
r.start_at.slice(0,10)===selectedDate
).length

return(
<div className="room-card" onClick={onClick}>

<div className="room-head">
<div className="room-name">
{room.name} 👥{room.capacity}
</div>

<div
className={`status ${count?"reserved":"available"}`}
>
{count?"Busy":"Available"}
</div>
</div>

<Timeline
roomId={room.id}
reservations={reservations}
selectedDate={selectedDate}
/>

<div className="desc">
{room.description}
</div>

<div className="small">
Reservations: {count}
</div>

<div className="small">
Viewing: {timeMode==="kyiv"
?"Kyiv time"
:"Local time"}
</div>

</div>
)
}
