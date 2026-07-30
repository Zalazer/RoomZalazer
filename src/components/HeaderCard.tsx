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
onEdit?:()=>void
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
onEdit,
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

<div style={{
display:"flex",
gap:"6px"
}}>

<button
className="secondary"
style={{
padding:"4px 10px",
fontSize:"12px"
}}
onClick={onEdit}
>
Edit
</button>

<button
className="logout"
onClick={onLogout}
>
Logout
</button>

</div>

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

<div
style={{
display:"flex",
alignItems:"center",
gap:"8px"
}}
>

<span>{workingHoursText}</span>

<button
className="primary"
style={{
padding:"2px 10px",
fontSize:"12px",
minWidth:"60px"
}}
onClick={()=>
setTimeMode(
timeMode==="kyiv"
?"local"
:"kyiv"
)
}
>
{timeMode==="kyiv"
?"Kyiv"
:"Local"}
</button>

</div>

</div>

<div className="info">
<span>Total Rooms</span>
<span>{rooms}</span>
</div>


<div className="info">
<span>My Reservations</span>

<div
style={{
display:"flex",
gap:"6px"
}}
>

<button
className="secondary"
style={{
padding:"4px 12px",
fontSize:"12px"
}}
onClick={onCurrent}
>
Current {current}
</button>

<button
className="secondary"
style={{
padding:"4px 12px",
fontSize:"12px"
}}
onClick={onPast}
>
Past {past}
</button>

</div>

</div>

</div>
)

}
