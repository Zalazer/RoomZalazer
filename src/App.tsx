import"./App.css"
import HeaderCard from"./components/HeaderCard"
import CalendarHeader from"./components/CalendarHeader"
import WeekSelector from"./components/WeekSelector"
import RoomCard from"./components/RoomCard"
import RoomDetailsModal from"./components/RoomDetailsModal"
import ReservationList from"./components/ReservationList"
import ReservationModal from"./components/ReservationModal"
import{useAppData}from"./hooks/useAppData"

export default function App(){

const a=useAppData()

if(!a.token)
return(
<div className="container">
<div className="card">
<h1>RoomZalazer</h1>
<input placeholder="Email" value={a.email} onChange={e=>a.setEmail(e.target.value)}/>
{a.loginError&&<div className="error">{a.loginError}</div>}
<input type="password" placeholder="Password" value={a.password} onChange={e=>a.setPassword(e.target.value)}/>
{a.registerMode&&<input placeholder="Name" value={a.name} onChange={e=>a.setName(e.target.value)}/>}
{a.registerError&&<div className="error">{a.registerError}</div>}
<button className="primary" onClick={a.registerMode?a.register:a.login}>{a.registerMode?"Register":"Login"}</button>
<button className="secondary" onClick={()=>a.setRegisterMode(!a.registerMode)}>{a.registerMode?"Back to Login":"Create Account"}</button>
</div>
</div>
)

return(
<>
<div className="container">

<HeaderCard
user={a.user?.name}
time={a.time}
localTime={a.localTime}
timeMode={a.timeMode}
setTimeMode={a.setTimeMode}
workingHoursText={a.workingHoursText}
rooms={a.rooms.length}
current={a.currentReservations.length}
past={a.pastReservations.length}
onLogout={a.logout}
onCurrent={()=>{
a.setShowCurrent(!a.showCurrent)
a.setShowPast(false)
}}
onPast={()=>{
a.setShowPast(!a.showPast)
a.setShowCurrent(false)
}}
/>

{a.showCurrent&&
<ReservationList
title="Current Reservations"
reservations={a.currentReservations}
timeMode={a.timeMode}
formatDateTime={a.formatDateTime}
onDelete={a.deleteReservation}
onEdit={a.editReservation}
onOpenPast={r=>{
a.setSelectedDate(r.start_at.slice(0,10))
const room=a.rooms.find(v=>v.id===r.room_id)
if(room)a.setSelectedRoom(room)
}}
/>
}

{a.showPast&&
<ReservationList
title="Past Reservations"
reservations={a.pastReservations}
timeMode={a.timeMode}
formatDateTime={a.formatDateTime}
onDelete={a.deleteReservation}
onEdit={a.editReservation}
onOpenPast={r=>{
a.setSelectedDate(r.start_at.slice(0,10))
const room=a.rooms.find(v=>v.id===r.room_id)
if(room)a.setSelectedRoom(room)
}}
/>
}

<CalendarHeader
selectedDate={a.selectedDate}
formatDate={a.formatDate}
/>

<WeekSelector
selectedDate={a.selectedDate}
setSelectedDate={a.setSelectedDate}
formatDate={a.formatDate}
/>

{a.rooms.map(room=>
<RoomCard
key={room.id}
room={room}
reservations={a.reservations}
selectedDate={a.selectedDate}
timeMode={a.timeMode}
onClick={()=>a.setSelectedRoom(room)}
/>
)}

<div className="footer">
RoomZalazer • Google Calendar Style
</div>

</div>

<button className="float" onClick={()=>a.setShowModal(true)}>
+
</button>

<ReservationModal
show={a.showModal}
rooms={a.rooms}
times={a.TIMES}
reservations={a.reservations}
selectedDate={a.selectedDate}
timeMode={a.timeMode}
title={a.title}
setTitle={a.setTitle}
roomId={a.roomId}
setRoomId={a.setRoomId}
start={a.start}
setStart={a.setStart}
end={a.end}
setEnd={a.setEnd}
onReserve={a.reserveRoom}
onClose={()=>a.setShowModal(false)}
editing={a.editing}
error={a.reserveError}
loading={a.isReserving}
/>

{a.selectedRoom&&
<RoomDetailsModal
room={a.selectedRoom}
reservations={a.reservations}
selectedDate={a.selectedDate}
timeMode={a.timeMode}
times={a.TIMES}
onClose={()=>a.setSelectedRoom(null)}
onCreate={()=>{
a.setRoomId(String(a.selectedRoom!.id))
a.setSelectedRoom(null)
a.setShowModal(true)
}}
/>
}

</>
)

}
