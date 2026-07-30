import{useEffect,useState}from"react"

const API="https://meeting.shooleeyack.workers.dev"

export const TIMES=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30"]

export const kyivDate=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Kyiv"}).format(new Date())
export const kyivTime=()=>new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kyiv",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date())

export type User={id:string,name:string,email:string}
export type Room={id:number,name:string,capacity:number,description:string}

export type Reservation={
id:number
room_id:number
title:string
start_at:string
end_at:string
user_name?:string
room_name?:string
room_capacity?:number
status?:string
}

const mins=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3,5))

const nextSlot=(reservations:Reservation[],date:string)=>{
const now=new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/Kyiv"}))
const m=now.getHours()*60+now.getMinutes()
let slot=Math.ceil(m/30)*30
if(date!==kyivDate())slot=540
if(slot<540)slot=540
const busy=reservations.filter(r=>r.start_at.startsWith(date)).map(r=>({s:mins(r.start_at.slice(11,16)),e:mins(r.end_at.slice(11,16))}))
while(slot<1140){
const clash=busy.find(v=>slot>=v.s&&slot<v.e)
if(!clash)return`${String(Math.floor(slot/60)).padStart(2,"0")}:${String(slot%60).padStart(2,"0")}`
slot=clash.e
}
return TIMES[TIMES.length-1]
}

export function useAppData(){

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

const[timeMode,setTimeMode]=useState<"kyiv"|"local">(localStorage.getItem("timeMode")==="local"?"local":"kyiv")
useEffect(()=>localStorage.setItem("timeMode",timeMode),[timeMode])

const[selectedRoom,setSelectedRoom]=useState<Room|null>(null)

const[showModal,_setShowModal]=useState(false)


const setShowModal=(v:boolean)=>{
if(v){
const s=nextSlot(reservations,selectedDate)
setStart(s)
const e=mins(s)+30
setEnd(`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`)
setReserveError("")
}else{
setEditing(false)
setEditingId(null)
}
_setShowModal(v)
}


const[title,setTitle]=useState("")
const[roomId,setRoomId]=useState("")
const[start,setStart]=useState("09:00")
const[end,setEnd]=useState("09:30")

const[email,setEmail]=useState("")
const[password,setPassword]=useState("")
const[name,setName]=useState("")
const[registerMode,setRegisterMode]=useState(false)

const[reserveError,setReserveError]=useState("")
const[loginError,setLoginError]=useState("")
const[registerError,setRegisterError]=useState("")
const[isReserving,setIsReserving]=useState(false)

const[editingId,setEditingId]=useState<number|null>(null)
const[editing,setEditing]=useState(false)

useEffect(()=>{

const update=()=>{
setTime(kyivTime())
setLocalTime(new Date().toLocaleString("en-GB"))
}

update()

const t=setInterval(update,1000)

if(token)loadAll()

return()=>clearInterval(t)

},[token])

useEffect(()=>{
if(timeMode==="kyiv"){
setSelectedDate(kyivDate())
}else{
setSelectedDate(new Date().toISOString().slice(0,10))
}
},[timeMode])

async function api(path:string,options:any={}){

const headers:any={...(options.headers||{})}

if(token)headers.Authorization=`Bearer ${token}`

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

setLoginError("")

const r=await api("/auth/login",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email,password})
})

if(!r.ok){
setLoginError(r.error||"Login failed")
return
}

localStorage.setItem("token",r.token)
setToken(r.token)

}

async function register(){

setRegisterError("")

if(!name.trim()){
setRegisterError("Name is required")
return
}

if(password.length<8){
setRegisterError("Password must be 8-72 characters")
return
}

const r=await api("/auth/register",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({name,email,password})
})

if(!r.ok){
setRegisterError(r.error||"Registration failed")
return
}

setRegisterMode(false)

}

async function logout(){

await api("/auth/logout",{method:"POST"})

localStorage.removeItem("token")
setToken("")
setUser(null)

}


async function editReservation(id:number){
setReserveError("")
const r=myReservations.find(v=>v.id===id)
if(!r)return

setEditing(true)
setEditingId(id)

setTitle(r.title)
setRoomId(String(r.room_id))
setStart(r.start_at.slice(11,16))
setEnd(r.end_at.slice(11,16))

_setShowModal(true)

}


async function deleteReservation(id:number){

if(!confirm("Cancel reservation?"))return

await api(`/reservations/${id}`,{method:"DELETE"})
await loadAll()

}

async function reserveRoom(){

if(editing&&editingId!==null){
const r=await api(`/reservations/${editingId}`,{
method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
room_id:Number(roomId),
title:title.trim(),
description:"",
start_at:`${selectedDate}T${start}:00`,
end_at:`${selectedDate}T${end}:00`
})
})
if(!r.ok){
setReserveError(r.error||"Update failed.")
return
}
setEditing(false)
setEditingId(null)
setShowModal(false)
await loadAll()
return
}



setReserveError("")

if(isReserving)return

const clean=title.trim()

if(!clean){
setReserveError("Meeting title is required.")
return
}

if(clean.length>100){
setReserveError("Title must be 1-100 characters.")
return
}

if(!roomId){
setReserveError("Please select a room.")
return
}

const s=mins(start)
const e=mins(end)

if(e<=s){
setReserveError("End time must be after start time.")
return
}

if(e-s<30){
setReserveError("Minimum duration is 30 minutes.")
return
}

if(e-s>240){
setReserveError("Maximum duration is 4 hours.")
return
}

if(s<540||e>1140){
setReserveError("Working hours are 09:00-19:00.")
return
}

const nowKyiv=new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/Kyiv"}))

const selected=new Date(`${selectedDate}T${start}:00`)

if(selected<=nowKyiv){
setReserveError("Cannot reserve past time.")
return
}

setIsReserving(true)

const r=await api("/reservations",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
room_id:Number(roomId),
title:clean,
description:"",
start_at:`${selectedDate}T${start}:00`,
end_at:`${selectedDate}T${end}:00`
})
})

setIsReserving(false)

if(!r.ok){
setReserveError(r.error||"Slot is unavailable.")
return
}

setShowModal(false)
setTitle("")
setRoomId("")
setStart("09:00")
setEnd("09:30")
setEditing(false)
setEditingId(null)

await loadAll()

}

const currentReservations=myReservations.filter(r=>r.status!=="cancelled"&&new Date(r.end_at)>new Date())

const pastReservations=myReservations.filter(r=>r.status==="cancelled"||new Date(r.end_at)<=new Date())

const formatDate=(v:string)=>
new Intl.DateTimeFormat(
"en-GB",
{
timeZone:timeMode==="kyiv"
?"Europe/Kyiv"
:undefined,
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
}
).format(new Date(`${v}T00:00:00`))


const formatDateTime=(v:string)=>
new Intl.DateTimeFormat(
"en-GB",
{
timeZone:timeMode==="kyiv"
?"Europe/Kyiv"
:undefined,
weekday:"short",
day:"2-digit",
month:"2-digit",
year:"numeric",
hour:"2-digit",
minute:"2-digit",
hour12:false
}
).format(new Date(v))

const workingHoursText=(()=>{

if(timeMode==="kyiv"){
return"09:00 - 19:00 (Kyiv)"
}

const today=kyivDate()

const start=new Date(`${today}T09:00:00+03:00`)
const end=new Date(`${today}T19:00:00+03:00`)

const s=new Intl.DateTimeFormat(
"en-GB",
{
hour:"2-digit",
minute:"2-digit",
hour12:false
}
).format(start)

const e=new Intl.DateTimeFormat(
"en-GB",
{
hour:"2-digit",
minute:"2-digit",
hour12:false
}
).format(end)

return`${s} - ${e} (Your local time)`

})()


return{
token,user,rooms,reservations,
showCurrent,setShowCurrent,
showPast,setShowPast,
time,localTime,
selectedDate,setSelectedDate,
selectedRoom,setSelectedRoom,
showModal,setShowModal,
title,setTitle,
roomId,setRoomId,
start,setStart,
end,setEnd,
email,setEmail,
password,setPassword,
name,setName,
registerMode,setRegisterMode,
reserveError,loginError,registerError,
isReserving,
editing,
currentReservations,pastReservations,
login,register,logout,
editReservation,
deleteReservation,
reserveRoom,
formatDate,
formatDateTime,
workingHoursText,
timeMode,
setTimeMode,
TIMES
}

}
