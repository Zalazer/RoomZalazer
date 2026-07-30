type Props={
show:boolean
name:string
email:string
password:string
setName:(v:string)=>void
setEmail:(v:string)=>void
setPassword:(v:string)=>void
error:string
success:string
onSave:()=>void
onClose:()=>void
}

export default function ProfileModal({
show,
name,
email,
password,
setName,
setEmail,
setPassword,
error,
success,
onSave,
onClose
}:Props){

if(!show)return null

return(
<div className="profile-modal">

<div className="profile-modal-content">

<h2>Edit Profile</h2>

<input
placeholder="Name"
value={name}
onChange={e=>setName(e.target.value)}
/>

<input
placeholder="Email"
value={email}
onChange={e=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="New Password (optional)"
value={password}
onChange={e=>setPassword(e.target.value)}
/>

{error&&(
<div className="error">
{error}
</div>
)}

{success&&(
<div
style={{
color:"#37d76d",
fontSize:"14px",
marginTop:"8px",
marginBottom:"8px"
}}
>
{success}
</div>
)}

<div className="modal-buttons">

<button
className="primary"
onClick={onSave}
>
Save
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
