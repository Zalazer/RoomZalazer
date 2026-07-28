type Room={
  id:number
  name:string
}

type Props={
  show:boolean
  rooms:Room[]

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

function ReservationModal({

  show,
  rooms,

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
          Start
        </label>

        <input
          type="time"
          step="1800"
          value={start}
          onChange={(e)=>
            setStart(e.target.value)
          }
        />

        <label>
          End
        </label>

        <input
          type="time"
          step="1800"
          value={end}
          onChange={(e)=>
            setEnd(e.target.value)
          }
        />

        <div className="modal-buttons">

          <button
            className="primary"
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

export default ReservationModal
