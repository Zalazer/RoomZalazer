import{useEffect,useState}from"react"

const API="https://meeting.shooleeyack.workers.dev"

export const TIMES=["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30"]

export const kyivDate=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Kyiv"}).format(new Date())
export const kyivTime=()=>new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kyiv",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date())

export type User={id:string,name:string,email:string}
export type Room={id:number,name:string,capacity:number,description:string}
export type Reservation={id:number,room_id:number,title:string,start_at:string,end_at:string,user_name?:string,room_name?:string,status?:string}

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

const[reserveError,setReserveError]=useState("")
const[loginError,setLoginError]=useState("")
const[registerError,setRegisterError]=useState("")
const[isReserving,setIsReserving]=useState(false)

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
setLoginError(r.error)
return
}

localStorage.setItem("token",r.token)
setToken(r.token)

}

async function register(){

setRegisterError("")

const r=await api("/auth/register",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({name,email,password})
})

if(!r.ok){
setRegisterError(r.error)
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

async function deleteReservation(id:number){

if(!confirm("Cancel reservation?"))return

await api(`/reservations/${id}`,{method:"DELETE"})
await loadAll()

}

async function reserveRoom(){

setReserveError("")

if(!title.trim()){
setReserveError("Meeting title is required.")
return
}

if(title.trim().length>100){
setReserveError("Title must be 1-100 characters.")
return
}

if(!roomId){
setReserveError("Please select a room.")
return
}

setIsReserving(true)

const r=await api("/reservations",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
room_id:Number(roomId),
title,
description:"",
start_at:`${selectedDate}T${start}:00`,
end_at:`${selectedDate}T${end}:00`
})
})

setIsReserving(false)

if(!r.ok){
setReserveError(r.error||"Reservation failed.")
return
}

setShowModal(false)
setTitle("")
setRoomId("")
setStart("09:00")
setEnd("09:30")

await loadAll()

}

const currentReservations=myReservations.filter(
r=>r.status!=="cancelled"&&new Date(r.end_at)>new Date()
)

const pastReservations=myReservations.filter(
r=>r.status==="cancelled"||new Date(r.end_at)<=new Date()
)

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
currentReservations,pastReservations,
login,register,logout,
deleteReservation,reserveRoom,
TIMES
}

}
