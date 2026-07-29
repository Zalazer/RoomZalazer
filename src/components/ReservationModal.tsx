type Room={id:number,name:string}
type Reservation={id:number,room_id:number,start_at:string,end_at:string}

type Props={
show:boolean
rooms:Room[]
times:string[]
reservations:Reservation[]
selectedDate:string
title:string
setTitle:(v:string)=>void
roomId:string
setRoomId:(v:string)=>void
start:string
setStart:(v:string)=>void
end:string
setEnd:(v:string)=>void
onReserve:()=>void
onClose:()=>void
editing?:boolean
error?:string
loading?:boolean
}

export default function ReservationModal({
show,
rooms,
times,
reservations,
selectedDate,
title,
setTitle,
roomId,
setRoomId,
start,
setStart,
end,
setEnd,
onReserve,
onClose,
editing=false,
error="",
loading=false
}:Props){

if(!show)return null

const M=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3,5))

const roomReservations=
reservations
.filter(
r=>
r.room_id===Number(roomId)&&
r.start_at.slice(0,10)===selectedDate
)
.sort(
(a,b)=>a.start_at.localeCompare(b.start_at)
)

const startTimes=times.filter(t=>t!=="19:00")

const availableStartTimes=startTimes.filter(t=>{

const m=M(t)

return !roomReservations.some(r=>{

const s=M(r.start_at.slice(11,16))
const e=M(r.end_at.slice(11,16))

return m>=s&&m<e

})

})

const nextBusy=
roomReservations
.map(r=>M(r.start_at.slice(11,16)))
.find(m=>m>M(start))

const availableEndTimes=
times.filter(t=>{

const s=M(start)
const e=M(t)

return(
e>s&&
e<=s+240&&
e<=1140&&
(nextBusy===undefined||e<=nextBusy)
)

})

return(
<div className="modal">
<div className="modal-content">

<h2>
{editing?"Edit Reservation":"Reserve Meeting Room"}
</h2>

<div className="small">
{selectedDate}
</div>

<label>
Meeting title
</label>

<input
placeholder="Enter meeting title..."
value={title}
maxLength={100}
onChange={e=>setTitle(e.target.value)}
/>

{error&&
<div className="error">
{error}
</div>
}

<label>
Room
</label>

<select
value={roomId}
onChange={e=>setRoomId(e.target.value)}
>
<option value="">
Select room
</option>

{rooms.map(r=>
<option
key={r.id}
value={r.id}
>
{r.name}
</option>
)}

</select>

<label>
Start time
</label>

<select
value={start}
onChange={e=>setStart(e.target.value)}
>

{availableStartTimes.map(t=>
<option
key={t}
value={t}
>
{t}
</option>
)}

</select>

<label>
End time
</label>

<select
value={end}
onChange={e=>setEnd(e.target.value)}
>

{availableEndTimes.map(t=>
<option
key={t}
value={t}
>
{t}
</option>
)}

</select>

<div className="modal-buttons">

<button
className="primary"
disabled={
loading||
!title.trim()||
!roomId||
!availableEndTimes.length
}
onClick={onReserve}
>
{loading?"Reserving...":editing?"Save Changes":"Reserve"}
</button>

<button
className="secondary"
disabled={loading}
onClick={onClose}
>
Close
</button>

</div>

</div>
</div>
)

}
