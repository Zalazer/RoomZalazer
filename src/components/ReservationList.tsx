type Reservation={
id:number
room_id:number
room_name?:string
title:string
start_at:string
end_at:string
status?:string
}

type Props={
reservations:Reservation[]
onDelete:(id:number)=>void
}

export default function ReservationList({
reservations,
onDelete
}:Props){

const list=[...reservations].sort((a,b)=>{

const ac=a.status==="cancelled"
const bc=b.status==="cancelled"

if(ac&&!bc)return 1
if(!ac&&bc)return-1

return(
new Date(a.start_at).getTime()-
new Date(b.start_at).getTime()
)

})

const fmt=(v:string)=>
new Intl.DateTimeFormat(
"uk-UA",
{
timeZone:"Europe/Kyiv",
day:"2-digit",
month:"2-digit",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
}
).format(new Date(v))

const mins=(a:string,b:string)=>
(
new Date(b).getTime()-
new Date(a).getTime()
)/60000

return(
<div className="card">

<h2>My Reservations</h2>

{list.length===0?

<div className="small">
No reservations.
</div>

:

list.map(r=>{

const start=fmt(r.start_at)
const end=fmt(r.end_at).slice(-5)

return(

<div
key={r.id}
className="reservation"
>

<div className="title">
{r.room_name??`Room #${r.room_id}`} • {r.title}
</div>

<div className="small">
{start} - {end} ({mins(r.start_at,r.end_at)} min) • {r.status??"reserved"}
</div>

{r.status!=="cancelled"&&
<div className="actions">
<button
className="secondary"
onClick={()=>onDelete(r.id)}
>
Cancel
</button>
</div>
}

</div>

)

})

}

</div>
)

}
