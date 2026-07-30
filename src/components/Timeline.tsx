type Reservation={
 id:number
 room_id:number
 title:string
 user_name?:string
 start_at:string
 end_at:string
}

type Props={
 roomId:number
 reservations:Reservation[]
 selectedDate:string
 times:string[]
 timeMode:"kyiv"|"local"
}

export default function Timeline({
 roomId,
 reservations,
 selectedDate,
 times,
 timeMode
}:Props){

 const roomReservations=
 reservations.filter(
  r=>
   r.room_id===roomId &&
   r.start_at.slice(0,10)===selectedDate
 )

 const M=(v:string)=>
  Number(v.slice(0,2))*60+
  Number(v.slice(3,5))

 const fmt=(v:string)=>
 new Intl.DateTimeFormat(
  "en-GB",
  {
   hour:"2-digit",
   minute:"2-digit",
   hour12:false,
   timeZone:
    timeMode==="kyiv"
    ?"Europe/Kyiv"
    :undefined
  }
 ).format(new Date(v))

 function slotClass(
  slot:string
 ){

  const slotMinutes=M(slot)

  for(
   const reservation of roomReservations
  ){

   const start=fmt(
    reservation.start_at
   )

   const end=fmt(
    reservation.end_at
   )

   const startMinutes=
   M(start)

   const endMinutes=
   M(end)

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

   {times.map(slot=>(

    <div
     key={slot}
     className={
      `t ${slotClass(slot)}`
     }
     title={slot}
    />

   ))}

  </div>

 )

}
