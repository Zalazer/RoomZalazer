import type { Reservation } from "../hooks/useAppData"

type Props={
  title:string
  reservations:Reservation[]
  timeMode:"kyiv"|"local"
  formatDateTime:(v:string)=>string
  onDelete:(id:number)=>void
  onEdit:(id:number)=>void
  onOpenPast?:(r:Reservation)=>void
}

export default function ReservationList({
  title,
  reservations,
  timeMode,
  formatDateTime,
  onDelete,
  onEdit,
  onOpenPast
}:Props){

  const now=Date.now()

  const list=[...reservations].sort((a,b)=>{
    const ac=a.status==="cancelled"
    const bc=b.status==="cancelled"

    if(ac&&!bc)return 1
    if(!ac&&bc)return -1

    return (
      new Date(a.start_at).getTime()-
      new Date(b.start_at).getTime()
    )
  })

  const mins=(a:string,b:string)=>
    (new Date(b).getTime()-new Date(a).getTime())/60000

  const t=(v:string)=>
    formatDateTime(v).split(", ").pop()||""

  const floorSuffix=(floor?:number)=>{
    if(!floor)return"th"
    if(floor===1)return"st"
    if(floor===2)return"nd"
    if(floor===3)return"rd"
    return"th"
  }

  return(
    <div className="card">

      <h2>
        {title}
        {title.toLowerCase().includes("past")&&(
          <span className="small">
            &nbsp;(Tap to view)
          </span>
        )}
      </h2>

      <div
        className="small"
        style={{marginBottom:"10px"}}
      >
        Viewing in {
          timeMode==="kyiv"
            ?"Kyiv time"
            :"your local time"
        }
      </div>

      {!list.length?(
        <div className="small">
          No reservations.
        </div>
      ):(
        list.map(r=>{

          const finished=
            r.status!=="cancelled"&&
            new Date(r.end_at).getTime()<now

          const displayStatus=
            r.status==="cancelled"
              ?"cancelled"
              :finished
                ?"finished"
                :"reserved"

          const clickable=
            displayStatus==="finished"||
            displayStatus==="cancelled"

          return(
            <div
              key={r.id}
              className="reservation"
              style={{
                background:
                  displayStatus==="finished"
                    ?"rgba(255,255,255,.05)"
                    :displayStatus==="cancelled"
                      ?"rgba(255,80,80,.06)"
                      :undefined,
                cursor:clickable?"pointer":"default",
                marginBottom:"6px"
              }}
              onClick={()=>{
                if(clickable){
                  onOpenPast?.(r)
                }
              }}
            >

              <div className="title">
                {formatDateTime(r.start_at)}
                {" - "}
                {t(r.end_at)}
                {" ("}
                {mins(r.start_at,r.end_at)}
                {" min)"}
              </div>

              <div>
                {r.title}
              </div>

              <div className="small">
                {r.room.name}
                {" · "}
                {r.room.floor}
                {floorSuffix(r.room.floor)}
                {" floor · Capacity "}
                {r.room.capacity}
                {" · Status: "}
                {displayStatus}
              </div>

              {displayStatus==="reserved"&&(
                <div className="actions">

                  <button
                    className="secondary"
                    onClick={e=>{
                      e.stopPropagation()
                      onEdit(r.id)
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="secondary"
                    onClick={e=>{
                      e.stopPropagation()
                      onDelete(r.id)
                    }}
                  >
                    Cancel
                  </button>

                </div>
              )}

            </div>
          )

        })
      )}

    </div>
  )
}
