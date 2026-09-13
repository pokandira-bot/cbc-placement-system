import { useState, useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import jsPDF from 'jspdf'
const API = import.meta.env.VITE_API_URL || '${API}'
export default function App(){
  const [tab,setTab]=useState('dashboard')
  const [isAdmin,setIsAdmin]=useState(false)
  const [pass,setPass]=useState('')
  const [schools,setSchools]=useState([])
  const [students,setStudents]=useState([])
  const [search,setSearch]=useState('')
  const [editId,setEditId]=useState(null)
  const chart1Ref=useRef(null); const chart2Ref=useRef(null)
  const chartInst1=useRef(null); const chartInst2=useRef(null)

  const [sName,setSName]=useState(''); const [county,setCounty]=useState(''); const [cutoff,setCutoff]=useState(''); const [capacity,setCapacity]=useState(''); const [pathway,setPathway]=useState('STEM'); const [subjects,setSubjects]=useState('');
  const [stName,setStName]=useState(''); const [avg,setAvg]=useState(''); const [stPathway,setStPathway]=useState('STEM'); const [interest,setInterest]=useState(''); const [prefCounty,setPrefCounty]=useState(''); const [result,setResult]=useState(null)

  const load=async()=>{ const a=await fetch('${API}/api/schools'); setSchools(await a.json()); const b=await fetch('${API}/api/students'); setStudents(await b.json()); }
  useEffect(()=>{load()},[])

  // CHARTS EFFECT
  useEffect(()=>{
    if(tab!=='dashboard' || schools.length===0) return
    // destroy old
    if(chartInst1.current) chartInst1.current.destroy()
    if(chartInst2.current) chartInst2.current.destroy()

    const pathwayCount = {
      'STEM': schools.filter(s=>s.pathway==='STEM').length,
      'Arts & Sports Science': schools.filter(s=>s.pathway==='Arts & Sports Science').length,
      'Social Sciences': schools.filter(s=>s.pathway==='Social Sciences').length,
    }
    chartInst1.current = new Chart(chart1Ref.current, {
      type:'doughnut',
      data:{ labels:Object.keys(pathwayCount), datasets:[{ data:Object.values(pathwayCount), backgroundColor:['#667eea','#ed8936','#38a169'] }] },
      options:{ plugins:{ legend:{position:'bottom'} } }
    })
    chartInst2.current = new Chart(chart2Ref.current, {
      type:'bar',
      data:{ labels:schools.map(s=>s.name.slice(0,12)), datasets:[{ label:'Enrolled', data:schools.map(s=>s.enrolled), backgroundColor:'#667eea' }, { label:'Capacity', data:schools.map(s=>s.capacity), backgroundColor:'#e2e8f0' }] },
      options:{ responsive:true, plugins:{ legend:{position:'bottom'} } }
    })
  },[tab, schools])

  const saveSchool=async(e)=>{e.preventDefault(); const payload={name:sName,county,cutoff,capacity,pathway,subjects}; if(editId){await fetch(`${API}/api/schools/${editId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})} else {await fetch('${API}/api/schools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})} setSName('');setCounty('');setCutoff('');setCapacity('');setSubjects('');setEditId(null); load()}

  const place=async(e)=>{e.preventDefault(); const r=await fetch('${API}/api/place',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:stName,average:avg,pathway:stPathway,interestSubject:interest,preferredCounty:prefCounty})}); const data=await r.json(); setResult(data); load()}

  const generatePDF = (res) => {
    const doc = new jsPDF()
    doc.setFillColor(102,126,234); doc.rect(0,0,210,35,'F')
    doc.setTextColor(255); doc.setFontSize(20); doc.text('MINISTRY OF EDUCATION - CBC PLACEMENT', 10, 15)
    doc.setFontSize(12); doc.text('Official Placement Letter 2026', 10, 25)
    doc.setTextColor(0); doc.setFontSize(14); doc.text(`Date: ${res.date}`, 10, 45)
    doc.text(`Student Name: ${res.name}`, 10, 55)
    doc.text(`Average Score: ${res.average} Points`, 10, 65)
    doc.text(`Pathway: ${res.pathway}`, 10, 75)
    doc.text(`Interest: ${res.interestSubject}`, 10, 85)
    doc.setFontSize(16); doc.text('PLACED TO:', 10, 100)
    if(res.placedSchools[0]){
      const s = res.placedSchools[0]
      doc.setFontSize(13)
      doc.text(`School: ${s.name}`, 10, 110)
      doc.text(`County: ${s.county} | Pathway: ${s.pathway}`, 10, 120)
      doc.text(`Cutoff: ${s.cutoff} | Subjects: ${s.subjects.slice(0,3).join(', ')}`, 10, 130)
    }
    doc.setFontSize(10); doc.text('This is a computer-generated letter. Verify via QR code at portal.', 10, 170)
    doc.text(`Ref No: CBC-${res.id} | Verification Code: ${Math.random().toString(36).toUpperCase().slice(2,8)}`, 10, 180)
    doc.text('__________________________ __________________________', 10, 200)
    doc.text('Principal Signature Ministry Stamp', 10, 206)
    doc.save(`${res.name}_CBC_Placement_Letter.pdf`)
  }

  const filtered=schools.filter(s=> s.name.toLowerCase().includes(search.toLowerCase()) || s.county.toLowerCase().includes(search.toLowerCase()))

  return(
    <div style={{fontFamily:'Inter, Segoe UI', background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', minHeight:'100vh', padding:'0'}}>
      <div style={{maxWidth:'1200px', margin:'auto', padding:'20px'}}>
      <div style={{background:'rgba(255,255,255,0.95)', backdropFilter:'blur(10px)', borderRadius:'20px', padding:'25px', marginBottom:'20px'}}>
        <h1 style={{margin:0, textAlign:'center', color:'#2d3748'}}>🎓 CBC PLACEMENT PORTAL PRO</h1>
        <p style={{textAlign:'center', color:'#718096'}}>Charts + PDF + Permanent DB | Final Year Project</p>
        <div style={{display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginTop:'15px'}}>
          {[{k:'dashboard',l:'📊 Dashboard'},{k:'student',l:'🎓 Place Student'},{k:'view',l:`🏫 Schools (${schools.length})`},{k:'students',l:`👨‍🎓 Students (${students.length})`},{k:'admin',l:'🔐 Admin'}].map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{padding:'10px 18px', borderRadius:'30px', border:'none', cursor:'pointer', background:tab===t.k?'#667eea':'#edf2f7', color:tab===t.k?'white':'#2d3748', fontWeight:'700'}}>{t.l}</button>)}
        </div>
      </div>

      {tab==='dashboard' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
          <div style={glass}><h3>📈 Pathway Distribution</h3><canvas ref={chart1Ref}></canvas></div>
          <div style={glass}><h3>🏫 Enrollment vs Capacity</h3><canvas ref={chart2Ref}></canvas></div>
          <div style={{...glass, gridColumn:'span 2'}}><h3>Capacity Usage</h3>{schools.map(s=><div key={s.id} style={{margin:'10px 0'}}><div style={{display:'flex', justifyContent:'space-between'}}><b>{s.name} ({s.pathway})</b><span>{s.enrolled}/{s.capacity}</span></div><div style={{background:'#e2e8f0', height:'10px', borderRadius:'10px'}}><div style={{width:`${(s.enrolled/s.capacity)*100}%`, height:'10px', borderRadius:'10px', background:s.enrolled>=s.capacity?'#e53e3e':'#667eea'}}></div></div></div>)}</div>
        </div>
      )}

      {tab==='admin' &&!isAdmin && <div style={glass}><h2>Admin Login</h2><p>password: <b>admin123</b></p><form onSubmit={e=>{e.preventDefault(); if(pass==='admin123') setIsAdmin(true); else alert('wrong')}}><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" style={inp}/><button style={btnPrimary}>Login</button></form></div>}

      {tab==='admin' && isAdmin && (
        <div style={glass}><h2>{editId?'Edit':'Add'} School</h2>
          <form onSubmit={saveSchool} style={{display:'grid', gap:'10px'}}>
            <input value={sName} onChange={e=>setSName(e.target.value)} placeholder="School Name" required style={inp}/>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input value={county} onChange={e=>setCounty(e.target.value)} placeholder="County" required style={inp}/><select value={pathway} onChange={e=>setPathway(e.target.value)} style={inp}><option>STEM</option><option>Arts & Sports Science</option><option>Social Sciences</option></select></div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input type="number" value={cutoff} onChange={e=>setCutoff(e.target.value)} placeholder="Cutoff" required style={inp}/><input type="number" value={capacity} onChange={e=>setCapacity(e.target.value)} placeholder="Capacity" required style={inp}/></div>
            <input value={subjects} onChange={e=>setSubjects(e.target.value)} placeholder="Subjects comma separated" required style={inp}/>
            <button style={btnPrimary}>{editId?'Update':'Add'} School</button>
          </form>
          <div style={{marginTop:'15px'}}>{schools.map(s=><div key={s.id} style={{background:'white', padding:'10px', borderRadius:'10px', margin:'6px 0', display:'flex', justifyContent:'space-between'}}><span><b>{s.name}</b> | {s.county} | {s.pathway}</span><span><button onClick={()=>{setEditId(s.id); setSName(s.name); setCounty(s.county); setCutoff(s.cutoff); setCapacity(s.capacity); setPathway(s.pathway); setSubjects(s.subjects.join(', '))}}>Edit</button> <button onClick={async()=>{ await fetch(`${API}/api/schools/${s.id}`,{method:'DELETE'}); load()}} style={{color:'red'}}>Del</button></span></div>)}</div>
        </div>
      )}

      {tab==='student' && (
        <div style={glass}><h2>Student CBC Placement</h2>
          <form onSubmit={place} style={{display:'grid', gap:'12px'}}>
            <input value={stName} onChange={e=>setStName(e.target.value)} placeholder="Full Name" required style={inp}/>
            <input type="number" value={avg} onChange={e=>setAvg(e.target.value)} placeholder="Average Points" required style={inp}/>
            <select value={stPathway} onChange={e=>setStPathway(e.target.value)} style={inp}><option>STEM</option><option>Arts & Sports Science</option><option>Social Sciences</option></select>
            <input value={interest} onChange={e=>setInterest(e.target.value)} placeholder="Interest Subject" required style={inp}/>
            <input value={prefCounty} onChange={e=>setPrefCounty(e.target.value)} placeholder="Preferred County (optional)" style={inp}/>
            <button style={btnPrimary}>Find Placement</button>
          </form>
          {result && <div style={{marginTop:'20px', background:'white', padding:'20px', borderRadius:'15px', border:'3px solid #48bb78'}}>
            <h3>Results for {result.name} - {result.pathway}</h3>
            {result.placedSchools.map(s=><div key={s.id} style={{padding:'12px', background:'#f0fff4', borderRadius:'10px', margin:'8px 0'}}><b>{s.name}</b> - {s.county} - Cutoff {s.cutoff}</div>)}
            {result.placedSchools[0] && <><div style={{marginTop:'15px', padding:'15px', background:'#fffff0', border:'2px dashed #d69e2e'}}><h4 style={{textAlign:'center'}}>--- OFFICIAL LETTER PREVIEW ---</h4><p>Dear {result.name}, you are placed to <b>{result.placedSchools[0].name}</b> under <b>{result.pathway}</b></p></div><button onClick={()=>generatePDF(result)} style={{...btnPrimary, width:'100%', marginTop:'12px', background:'#38a169'}}>📄 Download PDF Placement Letter</button></>}
          </div>}
        </div>
      )}
      {tab==='view' && <div style={glass}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={inp}/>{filtered.map(s=><div key={s.id} style={{background:'white', padding:'15px', borderRadius:'12px', margin:'10px 0', borderLeft:`6px solid ${s.pathway==='STEM'?'#667eea': s.pathway==='Arts & Sports Science'?'#ed8936':'#38a169'}`}}><h3 style={{margin:'0'}}>{s.name}</h3><p>{s.county} | {s.pathway} | {s.enrolled}/{s.capacity}</p></div>)}</div>}
      {tab==='students' && <div style={glass}><h2>Placed Students</h2>{students.map(s=><div key={s.id} style={{background:'white', padding:'10px', borderRadius:'10px', margin:'8px 0', display:'flex', justifyContent:'space-between'}}><span>{s.name} - {s.pathway} - {s.placedSchools.map(x=>x.name).join(', ')}</span><button onClick={async()=>{await fetch(`${API}/api/students/${s.id}`,{method:'DELETE'}); setResult(null); load()}} style={{color:'red'}}>Delete</button></div>)}</div>}
      </div>
    </div>
  )
}
const glass={background:'rgba(255,255,255,0.93)', padding:'20px', borderRadius:'20px', boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}
const inp={padding:'14px', borderRadius:'10px', border:'1px solid #e2e8f0', width:'100%', boxSizing:'border-box', fontSize:'15px'}
const btnPrimary={padding:'14px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', fontWeight:'bold', cursor:'pointer', fontSize:'16px'}