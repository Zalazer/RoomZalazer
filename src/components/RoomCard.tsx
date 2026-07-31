import Timeline from "./Timeline"
import { getTimes } from "../hooks/useAppData"

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
floor:number
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

const floorLabel=(n:number)=>{
if(n===1)return"1st floor"
if(n===2)return"2nd floor"
if(n===3)return"3rd floor"
return`${n}th floor`
}

const roomReservations=
reservations.filter(
r=>
r.room_id===room.id&&
r.start_at.slice(0,10)===selectedDate
)

const now=
timeMode==="kyiv"
?new Date(
new Date().toLocaleString(
"en-US",
{timeZone:"Europe/Kyiv"}
)
)
:new Date()

const active=
roomReservations.find(r=>{

const s=new Date(r.start_at)
const e=new Date(r.end_at)

return now>=s&&now<e

})

const fmt=(value:string)=>
new Intl.DateTimeFormat(
"en-GB",
{
hour:"2-digit",
minute:"2-digit",
hour12:false,
timeZone:
timeMode==="kyiv"
?"Europe/Kyiv"
:undefined
}
).format(new Date(value))

const officeEnd=(()=>{
const d=new Date(`${selectedDate}T19:00:00+03:00`)
return fmt(d.toISOString())
})()

const localTimeText=(()=>{
const d=active
?new Date(active.end_at)
:new Date(`${selectedDate}T19:00:00+03:00`)

return new Intl.DateTimeFormat(
"en-GB",
{
hour:"2-digit",
minute:"2-digit",
hour12:false
}
).format(d)
})()

const statusText=active
?`Busy till ${fmt(active.end_at)}`
:`Free till ${officeEnd}`

return(
<div className="room-card" onClick={onClick}>

<div className="room-head">

<div className="room-name">
{room.name} · {floorLabel(room.floor)} · Capacity {room.capacity}
</div>

</div>

<Timeline
roomId={room.id}
reservations={reservations}
selectedDate={selectedDate}
timeMode={timeMode}
times={getTimes(timeMode)}
/>

<div className="desc">
{room.description}
</div>

<div
className={`small ${active?"reserved":"available"}`}
style={{
fontWeight:600,
color:active?"#ff5757":"#37d76d"
}}
>
{statusText} · {timeMode==="kyiv"
?"Kyiv time"
:`Kyiv time (${localTimeText} local)`}
</div>

</div>
)
}
