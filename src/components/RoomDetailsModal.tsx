type Room={
id:number
name:string
capacity:number
description:string
}

type Reservation={
id:number
room_id:number
title:string
user_name?:string
start_at:string
end_at:string
}

type Props={
room:Room
reservations:Reservation[]
selectedDate:string
onClose:()=>void
}

const TIMES=[
"09:00","09:30","10:00","10:30",
"11:00","11:30","12:00","12:30",
"13:00","13:30","14:00","14:30",
"15:00","15:30","16:00","16:30",
"17:00","17:30","18:00","18:30"
]

export default function RoomDetailsModal({
room,
reservations,
selectedDate,
onClose
}:Props){

const list=reservations.filter(
r=>r.room_id===room.id&&r.start_at.slice(0,10)===selectedDate
)

return(
<div className="modal">
<div className="modal-content">

<h2>{room.name}</h2>

<div className="small">
Capacity: {room.capacity}
</div>

<br/>

{TIMES.map(time=>{

const item=list.find(r=>r.start_at.slice(11,16)===time)

return(
<div
key={time}
className="info"
>
<span>{time}</span>
<span>
{item
?`${item.title} (${item.user_name||"User"})`
:"FREE"}
</span>
</div>
)

})}

<div className="modal-buttons">
<button className="secondary" onClick={onClose}>
Close
</button>
</div>

</div>
</div>
)
}
