type Props={
selectedDate:string
}

export default function CalendarHeader({
selectedDate
}:Props){

const d=new Date(selectedDate)

return(
<div className="card" style={{textAlign:"center"}}>
<h2 style={{fontSize:"18px",margin:0}}>
Schedule for {d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
</h2>
</div>
)
}
