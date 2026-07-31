type Props={
selectedDate:string
formatDate:(v:string)=>string
}

export default function CalendarHeader({
selectedDate,
formatDate
}:Props){

return(
<div className="card" style={{textAlign:"center"}}>
<h2
style={{
fontSize:"16px",
margin:0
}}
>
Schedule for {formatDate(selectedDate)}
</h2>
</div>
)

}
