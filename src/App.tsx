import { useEffect, useState } from "react"
import "./App.css"

type Room={
id:number
name:string
capacity:number
description:string
}

const API="https://meeting.shooleeyack.workers.dev"

function App(){

const [rooms,setRooms]=useState<Room[]>([])
const [time,setTime]=useState("")
const [showModal,setShowModal]=useState(false)

const [title,setTitle]=useState("")
const [roomId,setRoomId]=useState("")
const [start,setStart]=useState("09:00")
const [end,setEnd]=useState("09:30")

useEffect(()=>{

loadRooms()

updateClock()

const timer=setInterval(
updateClock,
1000
)

return()=>clearInterval(timer)

},[])

async function loadRooms(){

const response=
await fetch(`${API}/rooms`)

setRooms(await response.json())

}

function updateClock(){

setTime(
new Date().toLocaleTimeString(
"en-GB"
)
)

}

async function reserveRoom(){

const today=
new Date()
.toISOString()
.slice(0,10)

const body={

room_id:Number(roomId),

user_id:"guest-user",

user_name:"Guest",

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
"Content-Type":
"application/json"
},
body:JSON.stringify(body)
}
)

const result=
await response.json()

if(result.ok){

alert(
"Reservation created!"
)

setShowModal(false)

setTitle("")

}else{

alert(
result.error ??
"Unknown error"
)

}

}

return(
<>

<div className="container">

<div className="card">

<h1>
RoomZalazer
</h1>

<div className="subtitle">
Smart Meeting Room
Reservation Platform
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

</div>

{rooms.map(room=>(

<div
key={room.id}
className="room-card"
>

<div className="room-head">

<div className="room-name">
{room.name}
{" "}
👥{room.capacity}
</div>

<div className="status available">
Available
</div>

</div>

<div className="desc">
{room.description}
</div>

</div>

))}

<div className="footer">
RoomZalazer • Step 11
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
Start
</label>

<input
type="time"
value={start}
onChange={(e)=>
setStart(
e.target.value
)
}
/>

<label>
End
</label>

<input
type="time"
value={end}
onChange={(e)=>
setEnd(
e.target.value
)
}
/>

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

export default App
