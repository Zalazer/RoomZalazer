import {useEffect} from "react"

type Room={
id:number
name:string
}

type Reservation={
id:number
room_id:number
start_at:string
end_at:string
}

type Props={
show:boolean

rooms:Room[]

times:string[]

reservations:Reservation[]

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
}

export default function ReservationModal({

show,

rooms,

times,

reservations,

title,
setTitle,

roomId,
setRoomId,

start,
setStart,

end,
setEnd,

onReserve,
onClose

}:Props){

if(!show)return null

function minutes(v:string){

return(
Number(v.slice(0,2))*60+
Number(v.slice(3,5))
)

}

const roomReservations=
reservations
.filter(
r=>r.room_id===Number(roomId)
)
.sort(
(a,b)=>
a.start_at.localeCompare(
b.start_at
)
)

const availableStartTimes=
times.filter(t=>{

const m=minutes(t)

for(const r of roomReservations){

const s=minutes(
r.start_at.slice(11,16)
)

const e=minutes(
r.end_at.slice(11,16)
)

if(
m>=s &&
m<e
){

return false

}

}

return true

})

const nextBusy=
roomReservations
.map(
r=>
minutes(
r.start_at.slice(11,16)
)
)
.find(
m=>m>minutes(start)
)

const availableEndTimes=
times.filter(t=>{

const s=minutes(start)
const e=minutes(t)

return(

e>s &&

e<=s+240 &&

e<=1140 &&

(
nextBusy===undefined ||
e<=nextBusy
)

)

})

useEffect(()=>{

if(
availableStartTimes.length &&
!availableStartTimes.includes(
start
)
){

setStart(
availableStartTimes[0]
)

}

},[roomId])

useEffect(()=>{

if(
availableEndTimes.length &&
!availableEndTimes.includes(
end
)
){

setEnd(
availableEndTimes[0]
)

}

},[start,roomId])

return(

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

{availableStartTimes.map(t=>(

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

{availableEndTimes.map(t=>(

<option
key={t}
value={t}
>
{t}
</option>

))}

</select>

<div className="modal-buttons">

<button
className="primary"
disabled={
!title ||
!roomId ||
availableEndTimes.length===0
}
onClick={onReserve}
>
Reserve
</button>

<button
className="secondary"
onClick={onClose}
>
Close
</button>

</div>

</div>

</div>

)

}
