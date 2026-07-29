type Reservation={
id:number
room_id:number
room_name?:string
room_capacity?:number
title:string
start_at:string
end_at:string
status?:string
}

type Props={
title:string
reservations:Reservation[]
onDelete:(id:number)=>void
onEdit:(id:number)=>void
}

export default function ReservationList({title,reservations,onDelete,onEdit}:Props){

const list=[...reservations].sort((a,b)=>{
const ac=a.status==="cancelled"
const bc=b.status==="cancelled"
if(ac&&!bc)return 1
if(!ac&&bc)return-1
return new Date(a.start_at).getTime()-new Date(b.start_at).getTime()
})

const day=(v:string)=>new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kyiv",weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(v))
const time=(v:string)=>new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kyiv",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(v))
const mins=(a:string,b:string)=>(new Date(b).getTime()-new Date(a).getTime())/60000

return(
<div className="card">
<h2>{title}</h2>

{!list.length?

<div className="small">No reservations.</div>

:

list.map(r=>(

<div key={r.id} className="reservation">

<div className="title">
{day(r.start_at)} {time(r.start_at)} - {time(r.end_at)} ({mins(r.start_at,r.end_at)} min)
</div>

<div>{r.title}</div>

<div className="small">
{r.room_name??`Room #${r.room_id}`} • {r.room_capacity??"?"} seats&nbsp;&nbsp;&nbsp;Status: {r.status??"reserved"}
</div>

{r.status!=="cancelled"&&
<div className="actions">
<button className="secondary" onClick={()=>onEdit(r.id)}>Edit</button>
<button className="secondary" onClick={()=>onDelete(r.id)}>Cancel</button>
</div>
}

</div>

))

}

</div>
)

}
