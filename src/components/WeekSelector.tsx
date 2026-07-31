type Props={
selectedDate:string
setSelectedDate:(v:string)=>void
formatDate:(v:string)=>string
}

export default function WeekSelector({
selectedDate,
setSelectedDate
}:Props){

const current=new Date(`${selectedDate}T00:00:00`)

const localDate=(d:Date)=>{
const y=d.getFullYear()
const m=String(d.getMonth()+1).padStart(2,"0")
const day=String(d.getDate()).padStart(2,"0")
return`${y}-${m}-${day}`
}

function addWeek(days:number){
const d=new Date(current)
d.setDate(d.getDate()+days)
setSelectedDate(localDate(d))
}

function changeMonth(dir:-1|1){

const d=new Date(current)

const day=d.getDate()

d.setMonth(d.getMonth()+dir)

const maxDay=new Date(
d.getFullYear(),
d.getMonth()+1,
0
).getDate()

d.setDate(Math.min(day,maxDay))

setSelectedDate(localDate(d))

}

const today=localDate(new Date())

return(
<div className="card">

<div
style={{
display:"flex",
gap:"4px",
marginBottom:"12px",
justifyContent:"center",
flexWrap:"nowrap"
}}
>

<button
className="secondary"
style={{
padding:"8px 10px",
fontSize:"14px"
}}
onClick={()=>changeMonth(-1)}
>
{"<< M"}
</button>

<button
className="secondary"
style={{
padding:"8px 10px",
fontSize:"14px"
}}
onClick={()=>addWeek(-7)}
>
{"< W"}
</button>

<button
className="primary"
style={{
padding:"8px 10px",
fontSize:"14px"
}}
onClick={()=>setSelectedDate(today)}
>
Today
</button>

<button
className="secondary"
style={{
padding:"8px 10px",
fontSize:"14px"
}}
onClick={()=>addWeek(7)}
>
{"W >"}
</button>

<button
className="secondary"
style={{
padding:"8px 10px",
fontSize:"14px"
}}
onClick={()=>changeMonth(1)}
>
{"M >>"}
</button>

</div>

<div
style={{
display:"flex",
gap:"4px",
justifyContent:"center",
flexWrap:"nowrap"
}}
>

{[0,1,2,3,4,5,6].map(i=>{

const weekStart=new Date(current)

weekStart.setDate(
current.getDate()-
((current.getDay()+6)%7)
)

const d=new Date(weekStart)

d.setDate(weekStart.getDate()+i)

const value=localDate(d)

return(
<button
key={value}
className={
value===selectedDate
?"primary"
:"secondary"
}
style={{
padding:"6px",
fontSize:"12px",
minWidth:"44px",
lineHeight:"1.1",
display:"flex",
flexDirection:"column",
alignItems:"center",
flex:1,
opacity:i>=5?0.85:1,
background:
value===selectedDate
?undefined
:i>=5
?"rgba(255,87,87,.15)"
:undefined
}}
onClick={()=>setSelectedDate(value)}
>

<span>
{d.toLocaleDateString(
"en-GB",
{
weekday:"short"
}
)}
</span>

<span>
{d.toLocaleDateString(
"en-GB",
{
day:"2-digit"
}
)}
</span>

</button>
)

})}

</div>

</div>
)

}
