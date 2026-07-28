import { useEffect, useState } from "react"

import "./App.css"

import HeaderCard from "./components/HeaderCard"
import ReservationList from "./components/ReservationList"
import RoomCard from "./components/RoomCard"
import ReservationModal from "./components/ReservationModal"

const API="https://meeting.shooleeyack.workers.dev"

export type Room={
  id:number
  name:string
  capacity:number
  description:string
}

export type Reservation={
  id:number
  room_id:number
  title:string
  user_name:string
  start_at:string
  end_at:string
}

const USER_NAME="Guest"

function App(){

  const [rooms,setRooms]=useState<Room[]>([])
  const [reservations,setReservations]=useState<Reservation[]>([])

  const [time,setTime]=useState("")

  const [showModal,setShowModal]=useState(false)

  const [title,setTitle]=useState("")
  const [roomId,setRoomId]=useState("")
  const [start,setStart]=useState("09:00")
  const [end,setEnd]=useState("09:30")

  useEffect(()=>{

    loadData()

    updateClock()

    const timer=setInterval(
      updateClock,
      1000
    )

    return()=>clearInterval(timer)

  },[])

  async function loadData(){

    const r1=
      await fetch(`${API}/rooms`)

    const r2=
      await fetch(`${API}/reservations`)

    setRooms(await r1.json())
    setReservations(await r2.json())

  }

  function updateClock(){

    setTime(
      new Date()
        .toLocaleTimeString("en-GB")
    )

  }

  async function reserveRoom(){

    const today=
      new Date()
      .toISOString()
      .slice(0,10)

    const body={

      room_id:Number(roomId),

      user_id:"guest-user",

      user_name:USER_NAME,

      title,

      description:"",

      start_at:
        `${today}T${start}:00`,

      end_at:
        `${today}T${end}:00`

    }

    const response=
      await fetch(
        `${API}/reservations`,
        {
          method:"POST",
          headers:{
            "Content-Type":
            "application/json"
          },
          body:JSON.stringify(body)
        }
      )

    const result=
      await response.json()

    if(result.ok){

      await loadData()

      setShowModal(false)

      setTitle("")

      alert(
        "Reservation created!"
      )

    }else{

      alert(
        result.error ??
        "Unknown error"
      )

    }

  }

  return(
    <>

      <div className="container">

        <HeaderCard
          time={time}
          rooms={rooms.length}
          reservations={
            reservations.length
          }
        />

        <ReservationList
          reservations={reservations}
        />

        {rooms.map(room=>(

          <RoomCard
            key={room.id}
            room={room}
            reservations={
              reservations
            }
          />

        ))}

        <div className="footer">
          RoomZalazer • Component Architecture
        </div>

      </div>

      <button
        className="float"
        onClick={()=>
          setShowModal(true)
        }
      >
        +
      </button>

      <ReservationModal

        show={showModal}

        rooms={rooms}

        title={title}
        setTitle={setTitle}

        roomId={roomId}
        setRoomId={setRoomId}

        start={start}
        setStart={setStart}

        end={end}
        setEnd={setEnd}

        onReserve={reserveRoom}

        onClose={()=>
          setShowModal(false)
        }

      />

    </>
  )

}

export default App
