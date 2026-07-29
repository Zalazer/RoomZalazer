type Props={
selectedDate:string
}

export default function CalendarHeader({
selectedDate
}:Props){

const d=new Date(selectedDate)

return(
<div className="card">
<h2>Week Schedule</h2>
<div className="small">
{d.toLocaleDateString(
"en-GB",
{
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
}
)}
</div>
<div className="small">
Office timezone: Europe/Kyiv
</div>
</div>
)
}
