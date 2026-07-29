import{useEffect,useState}from"react"
import"./App.css"
import HeaderCard from"./components/HeaderCard"
import CalendarHeader from"./components/CalendarHeader"
import WeekSelector from"./components/WeekSelector"
import RoomCard from"./components/RoomCard"
import RoomDetailsModal from"./components/RoomDetailsModal"
import ReservationList from"./components/ReservationList"
import ReservationModal from"./components/ReservationModal"

const API="https://meeting.shooleeyack.workers.dev"
const TIMES=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30"]

const kyivDate=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Kyiv"}).format(new Date())

const kyivTime=()=>new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kyiv",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date())

type User={id:string,name:string,email:string}
type Room={id:number,name:string,capacity:number,description:string}
type Reservation={id:number,room_id:number,title:string,start_at:string,end_at:string,user_name?:string,room_name?:string,status?:string}

export default function App(){

const[token,setToken]=useState(localStorage.getItem("token")||"")
const[user,setUser]=useState<User|null>(null)
const[rooms,setRooms]=useState<Room[]>([])
const[reservations,setReservations]=useState<Reservation[]>([])
const[myReservations,setMyReservations]=useState<Reservation[]>([])
const[showCurrent,setShowCurrent]=useState(false)
const[showPast,setShowPast]=useState(false)
const[time,setTime]=useState("")
const[localTime,setLocalTime]=useState("")
const[selectedDate,setSelectedDate]=useState(kyivDate())
const[selectedRoom,setSelectedRoom]=useState<Room|null>(null)

const[showModal,setShowModal]=useState(false)
const[title,setTitle]=useState("")
const[roomId,setRoomId]=useState("")
const[start,setStart]=useState("09:00")
const[end,setEnd]=useState("09:30")

const[email,setEmail]=useState("")
const[password,setPassword]=useState("")
const[name,setName]=useState("")
const[registerMode,setRegisterMode]=useState(false)

useEffect(()=>{

setTime(kyivTime())
setLocalTime(new Date().toLocaleString("en-GB"))

const t=setInterval(()=>{
setTime(kyivTime())
setLocalTime(new Date().toLocaleString("en-GB"))
},1000)

if(token)loadAll()

return()=>clearInterval(t)

},[token])

async function api(path:string,options:any={}){

const headers:any={...(options.headers||{})}

if(token)
headers.Authorization=`Bearer ${token}`

const r=await fetch(`${API}${path}`,{...options,headers})

return r.json()

}

async function loadAll(){

const me=await api("/auth/me")

if(!me.ok){
localStorage.removeItem("token")
setToken("")
setUser(null)
return
}

setUser(me.user)

setRooms(await api("/rooms"))
setReservations(await api("/reservations"))

const mine=await api("/my/reservations")

setMyReservations([
...(mine.upcoming||[]),
...(mine.past||[])
])

}

async function login(){

const r=await api("/auth/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email,password})
})

if(!r.ok)return alert(r.error)

localStorage.setItem("token",r.token)
setToken(r.token)

}

async function register(){

const r=await api("/auth/register",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({name,email,password})
})

if(!r.ok)return alert(r.error)

alert("Registered.")
setRegisterMode(false)

}

async function logout(){

await api("/auth/logout",{method:"POST"})

localStorage.removeItem("token")
setToken("")
setUser(null)

}

async function deleteReservation(id:number){

if(!confirm("Cancel reservation?"))return

await api(`/reservations/${id}`,{method:"DELETE"})
await loadAll()

}

async function reserveRoom(){

const kyivNow=new Intl.DateTimeFormat(
"en-GB",
{
timeZone:"Europe/Kyiv",
hour:"2-digit",
minute:"2-digit",
hour12:false
}
).format(new Date())

const currentMinutes=
Number(kyivNow.slice(0,2))*60+
Number(kyivNow.slice(3,5))

const startMinutes=
Number(start.slice(0,2))*60+
Number(start.slice(3,5))

if(selectedDate===kyivDate()&&startMinutes<=currentMinutes){
alert("This time slot has already passed.")
return
}

const body={
room_id:Number(roomId),
title,
description:"",
start_at:`${selectedDate}T${start}:00`,
end_at:`${selectedDate}T${end}:00`
}

const r=await api("/reservations",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(body)
})

if(!r.ok)return alert(r.error)

setShowModal(false)
setTitle("")
setRoomId("")
setStart("09:00")
setEnd("09:30")

await loadAll()

}

const currentReservations=myReservations.filter(
r=>
r.status!=="cancelled"&&
new Date(r.end_at)>new Date()
)

const pastReservations=myReservations.filter(
r=>
r.status==="cancelled"||
new Date(r.end_at)<=new Date()
)

if(!token)
return(
<div className="container">
<div className="card">

<h1>RoomZalazer</h1>

<input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>

<input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>

{registerMode&&
<input placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
}

<button className="primary" onClick={registerMode?register:login}>
{registerMode?"Register":"Login"}
</button>

<button className="secondary" onClick={()=>setRegisterMode(!registerMode)}>
{registerMode?"Back to Login":"Create Account"}
</button>

</div>
</div>
)

return(
<>

<div className="container">

<HeaderCard
user={user?.name}
time={time}
localTime={localTime}
rooms={rooms.length}
current={currentReservations.length}
past={pastReservations.length}
onLogout={logout}
onCurrent={()=>{
setShowCurrent(!showCurrent)
setShowPast(false)
}}
onPast={()=>{
setShowPast(!showPast)
setShowCurrent(false)
}}
/>

<CalendarHeader selectedDate={selectedDate}/>

<WeekSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>

{showCurrent&&
<ReservationList
title="Current Reservations"
reservations={currentReservations}
onDelete={deleteReservation}
/>
}

{showPast&&
<ReservationList
title="Past Reservations"
reservations={pastReservations}
onDelete={deleteReservation}
/>
}

{rooms.map(room=>
<RoomCard
key={room.id}
room={room}
reservations={reservations}
selectedDate={selectedDate}
onClick={()=>setSelectedRoom(room)}
/>
)}

<div className="footer">
RoomZalazer • Google Calendar Style
</div>

</div>

<button className="float" onClick={()=>setShowModal(true)}>
+
</button>

<ReservationModal
show={showModal}
rooms={rooms}
times={TIMES}
reservations={reservations}
selectedDate={selectedDate}
title={title}
setTitle={setTitle}
roomId={roomId}
setRoomId={setRoomId}
start={start}
setStart={setStart}
end={end}
setEnd={setEnd}
onReserve={reserveRoom}
onClose={()=>setShowModal(false)}
/>

{selectedRoom&&
<RoomDetailsModal
room={selectedRoom}
reservations={reservations}
selectedDate={selectedDate}
onClose={()=>setSelectedRoom(null)}
/>
}

</>

)

}
