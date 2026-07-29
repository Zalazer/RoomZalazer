type Props={
time:string
localTime:string
rooms:number
reservations:number
user?:string
onLogout?:()=>void
}

export default function HeaderCard({
time,
localTime,
rooms,
reservations,
user,
onLogout
}:Props){

return(
<div className="card">

<h1>RoomZalazer</h1>

<div className="subtitle">
Smart Meeting Room Reservation Platform
</div>

{user&&
<div className="info">
<span>User</span>
<span>{user}</span>
</div>
}

<div className="info">
<span>Office Time Kyiv</span>
<span>{time}</span>
</div>

<div className="info">
<span>User Local Time</span>
<span>{localTime}</span>
</div>

<div className="info">
<span>Working Hours</span>
<span>09:00 - 19:00 (Kyiv)</span>
</div>

<div className="info">
<span>Total Rooms</span>
<span>{rooms}</span>
</div>

<div className="info">
<span>My Reservations</span>
<span>{reservations}</span>
</div>

{user&&
<button className="secondary" onClick={onLogout}>
Logout
</button>
}

</div>
)

}
