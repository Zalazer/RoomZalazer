import {useEffect,useState} from "react"
import "./App.css"

import RoomCard from "./components/RoomCard"
import ReservationList from "./components/ReservationList"
import ReservationModal from "./components/ReservationModal"

const API="https://meeting.shooleeyack.workers.dev"

const TIMES=[
"09:00","09:30","10:00","10:30",
"11:00","11:30","12:00","12:30",
"13:00","13:30","14:00","14:30",
"15:00","15:30","16:00","16:30",
"17:00","17:30","18:00","18:30",
"19:00"
]

const USER_NAME="Guest"

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
user_name:string
start_at:string
end_at:string
}

export default function App(){

const [rooms,setRooms]=useState<Room[]>([])
const [reservations,setReservations]=
useState<Reservation[]>([])

const [time,setTime]=useState("")

const [showModal,setShowModal]=
useState(false)

const [editingReservation,
setEditingReservation]=
useState<Reservation|null>(null)

const [title,setTitle]=useState("")
const [roomId,setRoomId]=useState("")
const [start,setStart]=useState("09:00")
const [end,setEnd]=useState("09:30")

useEffect(()=>{

loadData()

updateClock()

const timer=setInterval(
updateClock,
1000
)

return()=>clearInterval(timer)

},[])

async function loadData(){

const r1=
await fetch(`${API}/rooms`)

const r2=
await fetch(
`${API}/reservations`
)

setRooms(await r1.json())
setReservations(await r2.json())

}

function updateClock(){

setTime(
new Date().toLocaleTimeString(
"en-GB"
)
)

}

function openCreate(){

setEditingReservation(null)

setTitle("")
setRoomId("")
setStart("09:00")
setEnd("09:30")

setShowModal(true)

}

function openEdit(
reservation:Reservation
){

setEditingReservation(
reservation
)

setTitle(
reservation.title
)

setRoomId(
String(
reservation.room_id
)
)

setStart(
reservation.start_at.slice(
11,
16
)
)

setEnd(
reservation.end_at.slice(
11,
16
)
)

setShowModal(true)

}

async function deleteReservation(
id:number
){

if(
!confirm(
"Cancel reservation?"
)
){
return
}

await fetch(
`${API}/reservations/${id}`,
{
method:"DELETE"
}
)

await loadData()

}

async function reserveRoom(){

const today=
new Date()
.toISOString()
.slice(0,10)

const body={

room_id:Number(roomId),

user_id:"guest",

user_name:USER_NAME,

title,

description:"",

start_at:
`${today}T${start}:00`,

end_at:
`${today}T${end}:00`

}

if(editingReservation){

await fetch(
`${API}/reservations/${editingReservation.id}`,
{
method:"PUT",
headers:{
"Content-Type":
"application/json"
},
body:JSON.stringify(body)
}
)

}else{

await fetch(
`${API}/reservations`,
{
method:"POST",
headers:{
"Content-Type":
"application/json"
},
body:JSON.stringify(body)
}
)

}

await loadData()

setShowModal(false)

}

return(

<>

<div className="container">

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
<span>{rooms.length}</span>
</div>

<div className="info">
<span>Total Reservations</span>
<span>{reservations.length}</span>
</div>

</div>

<ReservationList
reservations={reservations}
rooms={rooms}
userName={USER_NAME}
onEdit={openEdit}
onDelete={deleteReservation}
/>

{rooms.map(room=>(

<RoomCard
key={room.id}
room={room}
reservations={reservations}
/>

))}

<div className="footer">
RoomZalazer • Edit Enabled
</div>

</div>

<button
className="float"
onClick={openCreate}
>
+
</button>

<ReservationModal

show={showModal}

rooms={rooms}

times={TIMES}

reservations={reservations}

title={title}
setTitle={setTitle}

roomId={roomId}
setRoomId={setRoomId}

start={start}
setStart={setStart}

end={end}
setEnd={setEnd}

onReserve={reserveRoom}

onClose={()=>
setShowModal(false)
}

/>

</>

)

}
