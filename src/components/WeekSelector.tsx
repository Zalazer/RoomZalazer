type Props={
selectedDate:string
setSelectedDate:(v:string)=>void
}

export default function WeekSelector({
selectedDate,
setSelectedDate
}:Props){

const current=new Date(selectedDate)

function add(days:number){
const d=new Date(current)
d.setDate(d.getDate()+days)
setSelectedDate(d.toISOString().slice(0,10))
}

return(
<div className="card">

<div style={{display:"flex",gap:"8px",marginBottom:"12px",justifyContent:"center",flexWrap:"wrap"}}>
<button className="secondary" onClick={()=>add(-30)}>{"<<"}</button>
<button className="secondary" onClick={()=>add(-7)}>{"<"}</button>
<button className="primary" onClick={()=>setSelectedDate(new Date().toISOString().slice(0,10))}>Today</button>
<button className="secondary" onClick={()=>add(7)}>{">"}</button>
<button className="secondary" onClick={()=>add(30)}>{">>"}</button>
</div>

<div style={{display:"flex",gap:"8px",overflowX:"auto",justifyContent:"center"}}>
{[0,1,2,3,4].map(i=>{

const d=new Date(current)
d.setDate(current.getDate()-current.getDay()+1+i)

const value=d.toISOString().slice(0,10)

return(
<button
key={value}
className={value===selectedDate?"primary":"secondary"}
onClick={()=>setSelectedDate(value)}
>
{d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric"})}
</button>
)

})}
</div>

</div>
)
}
