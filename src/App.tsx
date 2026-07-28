import {useEffect,useState} from "react"
import "./App.css"
import RoomCard from "./components/RoomCard"
import ReservationList from "./components/ReservationList"

const API="https://meeting.shooleeyack.workers.dev"

const TIMES=[
"09:00","09:30","10:00","10:30",
"11:00","11:30","12:00","12:30",
"13:00","13:30","14:00","14:30",
"15:00","15:30","16:00","16:30",
"17:00","17:30","18:00","18:30"
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
const [reservations,setReservations]=useState<Reservation[]>([])
const [time,setTime]=useState("")

const [showModal,setShowModal]=useState(false)

const [title,setTitle]=useState("")
const [roomId,setRoomId]=useState("")
const [start,setStart]=useState("09:00")
const [end,setEnd]=useState("09:30")
const [error,setError]=useState("")

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

const r1=await fetch(`${API}/rooms`)
const r2=await fetch(`${API}/reservations`)

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

function minutes(v:string){

return(
Number(v.slice(0,2))*60+
Number(v.slice(3,5))
)

}

async function reserveRoom(){

setError("")

const s=minutes(start)
const e=minutes(end)

if(e<=s){

setError(
"End time must be later than start time."
)

return

}

if(e-s>240){

setError(
"Maximum reservation duration is 4 hours."
)

return

}

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
start_at:`${today}T${start}:00`,
end_at:`${today}T${end}:00`

}

const response=
await fetch(
`${API}/reservations`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(body)
}
)

const result=
await response.json()

if(result.ok){

await loadData()

setShowModal(false)

setTitle("")
setRoomId("")
setStart("09:00")
setEnd("09:30")

}else{

setError(
result.error ??
"Reservation failed."
)

}

}

return(
<>

<div className="container">

<div className="card">

<h1>RoomZalazer</h1>

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
reservations={
reservations.filter(
r=>r.user_name===USER_NAME
)
}
userName={USER_NAME}
/>

{rooms.map(room=>(

<RoomCard
key={room.id}
room={room}
reservations={reservations}
/>

))}

<div className="footer">
RoomZalazer • Tournament Build
</div>

</div>

<button
className="float"
onClick={()=>
setShowModal(true)
}
>
+
</button>

{showModal&&(

<div className="modal">

<div className="modal-content">

<h2>
Reserve Meeting Room
</h2>

<label>
Meeting title
</label>

<input
value={title}
onChange={(e)=>
setTitle(
e.target.value
)
}
/>

<label>
Room
</label>

<select
value={roomId}
onChange={(e)=>
setRoomId(
e.target.value
)
}
>

<option value="">
Select room
</option>

{rooms.map(room=>(

<option
key={room.id}
value={room.id}
>
{room.name}
</option>

))}

</select>

<label>
Start time
</label>

<select
value={start}
onChange={(e)=>
setStart(
e.target.value
)
}
>

{TIMES.map(t=>(

<option
key={t}
value={t}
>
{t}
</option>

))}

</select>

<label>
End time
</label>

<select
value={end}
onChange={(e)=>
setEnd(
e.target.value
)
}
>

{TIMES.map(t=>(

<option
key={t}
value={t}
>
{t}
</option>

))}

</select>

{error&&(
<div className="box">
{error}
</div>
)}

<div className="modal-buttons">

<button
className="primary"
onClick={
reserveRoom
}
>
Reserve
</button>

<button
className="secondary"
onClick={()=>
setShowModal(false)
}
>
Close
</button>

</div>

</div>

</div>

)}

</>
)

}
