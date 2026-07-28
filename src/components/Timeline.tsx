type Reservation={
  id:number
  room_id:number
  title:string
  user_name:string
  start_at:string
  end_at:string
}

type Props={
  roomId:number
  reservations:Reservation[]
}

const TIMES=[
"09:00",
"09:30",
"10:00",
"10:30",
"11:00",
"11:30",
"12:00",
"12:30",
"13:00",
"13:30",
"14:00",
"14:30",
"15:00",
"15:30",
"16:00",
"16:30",
"17:00",
"17:30",
"18:00",
"18:30"
]

export default function Timeline({
roomId,
reservations
}:Props){

function slotClass(slot:string){

const slotMinutes=
Number(slot.slice(0,2))*60+
Number(slot.slice(3,5))

const roomReservations=
reservations.filter(
r=>r.room_id===roomId
)

for(const reservation of roomReservations){

const start=
new Date(
reservation.start_at
)

const end=
new Date(
reservation.end_at
)

const startMinutes=
start.getHours()*60+
start.getMinutes()

const endMinutes=
end.getHours()*60+
end.getMinutes()

if(
slotMinutes>=startMinutes &&
slotMinutes<endMinutes
){
return "tr"
}

}

return "tf"
}

return(

<div className="timeline">

{TIMES.map(slot=>(

<div
key={slot}
className={`t ${slotClass(slot)}`}
/>

))}

</div>

)

}
