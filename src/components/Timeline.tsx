type Reservation={
 id:number
 room_id:number
 title:string
 start_at:string
 end_at:string
}

type Props={
 roomId:number
 reservations:Reservation[]
}

const TIMES=[
 "09:00","09:30","10:00","10:30",
 "11:00","11:30","12:00","12:30",
 "13:00","13:30","14:00","14:30",
 "15:00","15:30","16:00","16:30",
 "17:00","17:30","18:00","18:30"
]

export default function Timeline({
 roomId,
 reservations
}:Props){

 const roomReservations=reservations.filter(
  r=>r.room_id===roomId
 )

 const M=(v:string)=>
  Number(v.slice(0,2))*60+Number(v.slice(3,5))

 const slotClass=(slot:string)=>{
  const sm=M(slot)

  for(const r of roomReservations){
   const s=M(r.start_at.slice(11,16))
   const e=M(r.end_at.slice(11,16))

   if(sm>=s&&sm<e) return "tr"
  }

  return "tf"
 }

 return(
  <div className="timeline">
   {TIMES.map(t=>(
    <div
     key={t}
     className={`t ${slotClass(t)}`}
     title={t}
    />
   ))}
  </div>
 )
}
