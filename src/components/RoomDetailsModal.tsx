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
timeMode:"kyiv"|"local"
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
timeMode,
onClose
}:Props){

const list=reservations.filter(
r=>r.room_id===room.id&&r.start_at.slice(0,10)===selectedDate
)

const fmt=(v:string)=>
new Intl.DateTimeFormat(
"en-GB",
{
hour:"2-digit",
minute:"2-digit",
hour12:false,
timeZone:timeMode==="kyiv"
?"Europe/Kyiv"
:undefined
}
).format(new Date(v))

return(
<div className="modal">
<div className="modal-content room-modal">

<h2 style={{marginBottom:"10px"}}>
{room.name} • Capacity: {room.capacity}
</h2>

<div className="small" style={{marginBottom:"12px"}}>
Viewing in {timeMode==="kyiv"?"Kyiv time":"your local time"}
</div>

{TIMES.map(time=>{

const item=list.find(r=>{

const start=r.start_at.slice(11,16)
const end=r.end_at.slice(11,16)

return time>=start&&time<end

})

return(
<div
key={time}
className="info room-slot"
style={{
color:item?"#ffc0c0":"#97ffbd"
}}
>

<span>{time}</span>

<span>
{item
?`${fmt(item.start_at)}-${fmt(item.end_at)} ${item.title}`
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
