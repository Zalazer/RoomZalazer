type Reservation={
id:number
room_id:number
title:string
user_name:string
start_at:string
end_at:string
}

type Room={
id:number
name:string
}

type Props={
reservations:Reservation[]
rooms:Room[]
userName:string
onEdit:(r:Reservation)=>void
onDelete:(id:number)=>void
}

export default function ReservationList({

reservations,
rooms,
userName,
onEdit,
onDelete

}:Props){

const myReservations=
reservations.filter(
r=>r.user_name===userName
)

function roomName(id:number){

return(
rooms.find(
r=>r.id===id
)?.name ?? "Unknown"
)

}

return(

<div className="card">

<h2>
Today's Reservations
</h2>

{myReservations.length===0?(

<div className="small">
No reservations today.
</div>

):(myReservations.map(r=>(

<div
key={r.id}
className="reservation"
>

<div className="title">
{r.title}
</div>

<div className="small">
Room:
{" "}
{roomName(r.room_id)}
</div>

<div className="small">
{r.start_at.slice(11,16)}
{" - "}
{r.end_at.slice(11,16)}
</div>

<div className="actions">

<button
className="primary"
onClick={()=>
onEdit(r)
}
>
Edit
</button>

<button
className="secondary"
onClick={()=>
onDelete(r.id)
}
>
Cancel
</button>

</div>

</div>

)))}

</div>

)

}
