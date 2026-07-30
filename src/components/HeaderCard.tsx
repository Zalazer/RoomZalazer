type Props={
time:string
localTime:string
rooms:number
current:number
past:number
timeMode:"kyiv"|"local"
setTimeMode:(v:"kyiv"|"local")=>void
workingHoursText:string
user?:string
onLogout?:()=>void
onCurrent?:()=>void
onPast?:()=>void
}

export default function HeaderCard({
time,
localTime,
rooms,
current,
past,
timeMode,
setTimeMode,
workingHoursText,
user,
onLogout,
onCurrent,
onPast
}:Props){

return(
<div className="card">

<h1>RoomZalazer</h1>

<div className="subtitle">
Smart Meeting Room Reservation Platform
</div>

{user&&
<div className="user-row">
<span>{user}</span>

<button
className="logout"
onClick={onLogout}
>
Logout
</button>
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
<span>{workingHoursText}</span>
</div>

<div
style={{
display:"flex",
gap:"8px",
marginTop:"10px",
marginBottom:"10px"
}}
>
<button
className={timeMode==="kyiv"?"primary":"secondary"}
onClick={()=>setTimeMode("kyiv")}
>
Kyiv Time
</button>

<button
className={timeMode==="local"?"primary":"secondary"}
onClick={()=>setTimeMode("local")}
>
Local Time
</button>
</div>

<div className="info">
<span>Total Rooms</span>
<span>{rooms}</span>
</div>

<div className="reservation-tabs">

<button
className="secondary"
onClick={onCurrent}
>
Current ({current})
</button>

<button
className="secondary"
onClick={onPast}
>
Past ({past})
</button>

</div>

</div>
)

}
