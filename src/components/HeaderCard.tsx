type Props={
 time:string
 rooms:number
 reservations:number
 user?:string
 onLogout?:()=>void
}

export default function HeaderCard({
 time,
 rooms,
 reservations,
 user,
 onLogout
}:Props){

 return(
  <div className="card">

   <h1>
    RoomZalazer
   </h1>

   <div className="subtitle">
    Smart Meeting Room Reservation Platform
   </div>

   <div className="info">
    <span>Office Time</span>
    <span>{time}</span>
   </div>

   <div className="info">
    <span>Working Hours</span>
    <span>09:00 - 19:00 (Kyiv)</span>
   </div>

   <div className="info">
    <span>Total Rooms</span>
    <span>{rooms}</span>
   </div>

   <div className="info">
    <span>My Reservations</span>
    <span>{reservations}</span>
   </div>

   {user&&(
    <>
     <div className="info">
      <span>User</span>
      <span>{user}</span>
     </div>

     <button
      className="secondary"
      onClick={onLogout}
     >
      Logout
     </button>
    </>
   )}

  </div>
 )
}
