const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DATA_DIR = __dirname;
const SCHOOLS_FILE = path.join(DATA_DIR, 'schools.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');

// Load or create default
let schools = [];
let students = [];

if(fs.existsSync(SCHOOLS_FILE)){
  schools = JSON.parse(fs.readFileSync(SCHOOLS_FILE));
} else {
  schools = [
    { id: 1, name: 'Alliance High School', county: 'Kiambu', cutoff: 75, capacity: 50, enrolled: 0, pathway: 'STEM', subjects: ['Mathematics','Physics','Chemistry','Computer Studies'] },
    { id: 2, name: 'Sigalagala National Polytechnic', county: 'Kakamega', cutoff: 45, capacity: 100, enrolled: 0, pathway: 'STEM', subjects: ['Electrical','Mechanical','Building','Agriculture'] },
    { id: 3, name: 'Kisumu Arts & Talent Center', county: 'Kisumu', cutoff: 40, capacity: 60, enrolled: 0, pathway: 'Arts & Sports Science', subjects: ['Music','Theatre','Sports Science','Art & Design'] },
    { id: 4, name: 'Nairobi Social Sciences College', county: 'Nairobi', cutoff: 50, capacity: 80, enrolled: 0, pathway: 'Social Sciences', subjects: ['History','Business','Languages','Geography'] }
  ];
  fs.writeFileSync(SCHOOLS_FILE, JSON.stringify(schools, null, 2));
}

if(fs.existsSync(STUDENTS_FILE)){
  students = JSON.parse(fs.readFileSync(STUDENTS_FILE));
} else {
  students = [];
  fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
}

const saveAll = () => {
  fs.writeFileSync(SCHOOLS_FILE, JSON.stringify(schools, null, 2));
  fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
};

app.get('/api/schools', (req, res) => res.json(schools));
app.get('/api/students', (req, res) => res.json(students));

app.post('/api/schools', (req, res) => {
  const { name, county, cutoff, capacity, pathway, subjects } = req.body;
  const school = { id: Date.now(), name, county, cutoff: Number(cutoff), capacity: Number(capacity), enrolled: 0, pathway, subjects: subjects.split(',').map(s=>s.trim()).filter(Boolean) };
  schools.push(school); saveAll(); res.json(school);
});

app.put('/api/schools/:id', (req, res) => {
  const s = schools.find(x=>x.id===Number(req.params.id));
  if(!s) return res.status(404).json({msg:'not found'});
  const { name, county, cutoff, capacity, pathway, subjects } = req.body;
  s.name=name; s.county=county; s.cutoff=Number(cutoff); s.capacity=Number(capacity); s.pathway=pathway;
  s.subjects=subjects.split(',').map(x=>x.trim()).filter(Boolean); saveAll(); res.json(s);
});

app.delete('/api/schools/:id', (req, res) => { schools = schools.filter(x=>x.id!==Number(req.params.id)); saveAll(); res.json({msg:'deleted'}); });
app.delete('/api/students/:id', (req, res) => {
  const st = students.find(x=>x.id===Number(req.params.id));
  if(st){ st.placedSchools.forEach(ps=>{ let sc=schools.find(a=>a.id===ps.id); if(sc && sc.enrolled>0) sc.enrolled--; }); }
  students = students.filter(x=>x.id!==Number(req.params.id)); saveAll(); res.json({msg:'deleted'});
});

app.post('/api/place', (req, res) => {
  const { name, average, pathway, interestSubject, preferredCounty } = req.body;
  const avg = Number(average);
  let filtered = schools.filter(s=> avg >= s.cutoff && s.enrolled < s.capacity && s.pathway === pathway);
  if(filtered.length===0) filtered = schools.filter(s=> avg >= s.cutoff && s.enrolled < s.capacity); // fallback if no pathway match

  if(preferredCounty) {
    const cMatch = filtered.filter(s=>s.county.toLowerCase()===preferredCounty.toLowerCase());
    if(cMatch.length>0) filtered=cMatch;
  }
  const subMatch = filtered.filter(s=> s.subjects.some(sub=> sub.toLowerCase().includes(interestSubject.toLowerCase())));
  const final = subMatch.length>0? subMatch : filtered;
  const placed = final.slice(0,3);
  placed.forEach(p=>{ let r=schools.find(a=>a.id===p.id); if(r) r.enrolled++; });
  const student = { id:Date.now(), name, average:avg, pathway, interestSubject, preferredCounty:preferredCounty||'Any', placedSchools:placed, date:new Date().toLocaleString() };
  students.push(student); saveAll(); res.json(student);
});

app.get('/', (req,res)=>res.send('CBC Pro + Permanent DB Running'));
app.listen(PORT, ()=>console.log(`CBC PERMANENT Backend on http://localhost:${PORT}  Data saved to files! - server.js:86`));