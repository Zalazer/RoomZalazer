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

return `${y}-${m}-${day}`

}


function add(days:number){

const d=new Date(current)

d.setDate(
d.getDate()+days
)

setSelectedDate(
localDate(d)
)

}


const today=localDate(new Date())


return(
<div className="card">

<div style={{
display:"flex",
gap:"8px",
marginBottom:"12px",
justifyContent:"center",
flexWrap:"wrap"
}}>

<button
className="secondary"
onClick={()=>add(-30)}
>
{"<<"}
</button>

<button
className="secondary"
onClick={()=>add(-7)}
>
{"<"}
</button>

<button
className="primary"
onClick={()=>setSelectedDate(today)}
>
Today
</button>

<button
className="secondary"
onClick={()=>add(7)}
>
{">"}
</button>

<button
className="secondary"
onClick={()=>add(30)}
>
{">>"}
</button>

</div>


<div style={{
display:"flex",
gap:"6px",
justifyContent:"center"
}}>

{[0,1,2,3,4].map(i=>{

const d=new Date(current)

const monday=new Date(current)

monday.setDate(
current.getDate()-
((current.getDay()+6)%7)
)

d.setTime(
monday.getTime()
)

d.setDate(
monday.getDate()+i
)

const value=localDate(d)


return(
<button
key={value}
style={{
padding:"8px",
fontSize:"14px",
minWidth:"58px",
lineHeight:"1.2",
display:"flex",
flexDirection:"column",
alignItems:"center"
}}
className={
value===selectedDate
?"primary"
:"secondary"
}
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
