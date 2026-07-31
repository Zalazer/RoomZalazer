type Room={
  id:number
  name:string
  capacity:number
  description:string
  floor:number
}

type Reservation={
  id:number
  room_id:number
  title:string
  user_name?:string
  start_at:string
  end_at:string
}

type Props={
  room:Room
  reservations:Reservation[]
  selectedDate:string
  timeMode:"kyiv"|"local"
  times:string[]
  onClose:()=>void
  onCreate:()=>void
}

export default function RoomDetailsModal({
  room,
  reservations,
  selectedDate,
  timeMode,
  times,
  onClose,
  onCreate
}:Props){

  const list=reservations.filter(
    r=>
      r.room_id===room.id&&
      r.start_at.slice(0,10)===selectedDate
  )

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

  const floorSuffix=
    room.floor===1
      ?"st"
      :room.floor===2
      ?"nd"
      :room.floor===3
      ?"rd"
      :"th"

  return(
    <div className="modal">
      <div className="modal-content room-modal">

        <h2 style={{marginBottom:"10px"}}>
          {room.name}
          {" · "}
          {room.floor}
          {floorSuffix}
          {" floor · Capacity "}
          {room.capacity}
        </h2>

        <div
          className="small"
          style={{marginBottom:"12px"}}
        >
          Viewing in {
            timeMode==="kyiv"
              ?"Kyiv time"
              :"your local time"
          }
        </div>

        {times.map(time=>{

          const item=list.find(r=>{

            const start=fmt(r.start_at)
            const end=fmt(r.end_at)

            return time>=start&&time<end

          })

          return(
            <div
              key={time}
              className="info room-slot"
              style={{
                color:
                  item
                    ?"#ffc0c0"
                    :"#97ffbd"
              }}
            >

              <span>
                {time}
              </span>

              <span>
                {
                  item
                    ?`${fmt(item.start_at)}-${fmt(item.end_at)} ${item.user_name??"Reserved"}`
                    :"FREE"
                }
              </span>

            </div>
          )

        })}

        <div className="modal-buttons">

          <button
            className="secondary"
            onClick={onClose}
          >
            Close
          </button>

          <button
            className="primary"
            onClick={onCreate}
          >
            Create Reservation
          </button>

        </div>

      </div>
    </div>
  )
}
