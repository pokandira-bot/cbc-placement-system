import { useState, useEffect } from 'react'
const API = ''

export default function App(){
  const [tab,setTab]=useState('dashboard')
  const [schools,setSchools]=useState([])
  const [students,setStudents]=useState([])
  const [search,setSearch]=useState('')
  const [editId,setEditId]=useState(null)

  // Form states
  const [name,setName]=useState(''); const [county,setCounty]=useState(''); const [cutoff,setCutoff]=useState(''); const [capacity,setCapacity]=useState(''); const [pathway,setPathway]=useState('STEM')
  const [stIndex,setStIndex]=useState(''); const [stMarks,setStMarks]=useState(''); const [stCluster,setStCluster]=useState('STEM')
  const [result,setResult]=useState(null)

  const load=async()=>{
    try{
      const a=await fetch(`${API}/api/schools`); const dataA=await a.json(); setSchools(dataA)
      const b=await fetch(`${API}/api/students`); const dataB=await b.json(); setStudents(dataB)
    }catch(e){ console.log("Offline, using local"); }
  }
  useEffect(()=>{load()},[])

  // FILTER 1000 SCHOOLS BY SEARCH
  const filtered = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.county.toLowerCase().includes(search.toLowerCase())).slice(0,100)

  // ADMIN: ADD / EDIT SCHOOL
  const handleSaveSchool=async()=>{
    if(!name || !county) return alert("Fill name and county")
    const payload={name,county,cutoff:Number(cutoff),capacity:Number(capacity),pathway, enrolled:0}
    if(editId){
      await fetch(`${API}/api/schools/${editId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    }else{
      await fetch(`${API}/api/schools`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    }
    setName(''); setCounty(''); setCutoff(''); setCapacity(''); setEditId(null); load()
  }
  const handleEdit=(s)=>{ setEditId(s.id); setName(s.name); setCounty(s.county); setCutoff(s.cutoff); setCapacity(s.capacity); setPathway(s.pathway); setTab('schools') }
  const handleDelete=async(id)=>{ if(!confirm("Delete school?")) return; await fetch(`${API}/api/schools/${id}`,{method:'DELETE'}); load() }

  // SMART PLACEMENT - NO SUBJECTS TYPING!
  const handlePlace=async()=>{
    if(!stIndex || !stMarks) return alert("Enter Index and Marks")
    const res=await fetch(`${API}/api/place`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({indexNumber:stIndex,cluster:stCluster,kcpeMarks:Number(stMarks)})})
    const data=await res.json(); setResult(data.placed); load()
  }

  return(
    <div style={{padding:20,fontFamily:'Arial'}}>
      <h1>CBC Placement System - {schools.length} Schools</h1>
      <div style={{display:'flex',gap:10,marginBottom:20}}>
        <button onClick={()=>setTab('dashboard')}>Dashboard ({schools.length})</button>
        <button onClick={()=>setTab('schools')}>Schools ({schools.length})</button>
        <button onClick={()=>setTab('place')}>Smart Placement</button>
        <button onClick={()=>setTab('students')}>Students ({students.length})</button>
      </div>

      {tab==='dashboard' && <div>
        <input placeholder="Search 1000 schools..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:10,marginBottom:10}}/>
        <p>Showing {filtered.length} of {schools.length} schools - All 47 counties included</p>
        {filtered.map(s=> <div key={s.id} style={{border:'1px solid #ccc',padding:10,marginBottom:5}}><b>{s.name}</b> - {s.county} - {s.category||s.pathway} - Cutoff: {s.cutoff} <button onClick={()=>handleEdit(s)}>Edit</button> <button onClick={()=>handleDelete(s.id)}>Delete</button></div>)}
      </div>}

      {tab==='schools' && <div style={{maxWidth:400}}>
        <h3>{editId?'Edit School':'Add New School'}</h3>
        <input placeholder="School Name" value={name} onChange={e=>setName(e.target.value)} style={{width:'100%',padding:8,marginBottom:5}}/>
        <input placeholder="County e.g. Kakamega" value={county} onChange={e=>setCounty(e.target.value)} style={{width:'100%',padding:8,marginBottom:5}}/>
        <input placeholder="Cutoff e.g. 250" type="number" value={cutoff} onChange={e=>setCutoff(e.target.value)} style={{width:'100%',padding:8,marginBottom:5}}/>
        <input placeholder="Capacity e.g. 300" type="number" value={capacity} onChange={e=>setCapacity(e.target.value)} style={{width:'100%',padding:8,marginBottom:5}}/>
        <select value={pathway} onChange={e=>setPathway(e.target.value)} style={{width:'100%',padding:8,marginBottom:10}}>
          <option>STEM</option><option>Social Sciences</option><option>Arts & Sports Science</option>
        </select>
        <button onClick={handleSaveSchool} style={{padding:10,width:'100%',background:'#0a0',color:'#fff'}}>{editId?'Update School':'Add School'}</button>
        {editId && <button onClick={()=>{setEditId(null); setName(''); setCounty('')}} style={{marginTop:5}}>Cancel Edit</button>}
      </div>}

      {tab==='place' && <div style={{maxWidth:400}}>
        <h3>Smart Placement - No Subjects Typing!</h3>
        <p>Student enters Index + Marks + Cluster only. System auto-finds best 5 schools.</p>
        <input placeholder="Index Number e.g. 12345678" value={stIndex} onChange={e=>setStIndex(e.target.value)} style={{width:'100%',padding:8,marginBottom:5}}/>
        <input placeholder="KCPE Marks e.g. 350" type="number" value={stMarks} onChange={e=>setStMarks(e.target.value)} style={{width:'100%',padding:8,marginBottom:5}}/>
        <select value={stCluster} onChange={e=>setStCluster(e.target.value)} style={{width:'100%',padding:8,marginBottom:10}}>
          <option>STEM</option><option>Social Sciences</option><option>Arts & Sports Science</option>
        </select>
        <button onClick={handlePlace} style={{padding:10,width:'100%',background:'#00a',color:'#fff'}}>Place Student (Auto 5 Schools)</button>
        {result && <div style={{marginTop:15,border:'1px solid green',padding:10}}><h4>Placed in:</h4>{result.map((s,i)=><div key={i}>✅ {s.name} - {s.county} (Cutoff {s.cutoff})</div>)}</div>}
      </div>}

      {tab==='students' && <div>{students.map((st,i)=><div key={i} style={{border:'1px solid #ccc',padding:10,marginBottom:5}}>Index: {st.indexNumber} - Marks: {st.kcpeMarks} - {st.cluster} -> {st.placed?.length} schools</div>)}</div>}
    </div>
  )
}
