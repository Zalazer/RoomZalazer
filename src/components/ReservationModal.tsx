import {useEffect} from "react"

type Room={
id:number
name:string
}

type Props={
show:boolean
rooms:Room[]
times:string[]

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

const availableEndTimes=
times.filter(t=>{

const s=minutes(start)
const e=minutes(t)

return(
e>s &&
e<=1140 &&
e<=s+240
)

})

useEffect(()=>{

if(
availableEndTimes.length &&
!availableEndTimes.includes(end)
){

setEnd(
availableEndTimes[0]
)

}

},[start])

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
setTitle(e.target.value)
}
/>

<label>
Room
</label>

<select
value={roomId}
onChange={(e)=>
setRoomId(e.target.value)
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
setStart(e.target.value)
}
>

{times.map(t=>(

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
setEnd(e.target.value)
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
