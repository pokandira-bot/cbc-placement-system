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
    { id: 1, name: 'Alliance High School', county: 'Kiambu', cutoff: 75, capacity: 500, enrolled: 0, pathway: 'STEM', subjects: ['Mathematics','Physics','Chemistry']},
    { id: 2, name: 'Alliance Girls High School', county: 'Kiambu', cutoff: 74, capacity: 400, enrolled: 0, pathway: 'STEM', subjects: ['Mathematics','Biology','Chemistry']},
    { id: 3, name: 'Kenya High School', county: 'Nairobi', cutoff: 73, capacity: 400, enrolled: 0, pathway: 'STEM', subjects: ['Mathematics','Physics','Chemistry']},
    { id: 4, name: 'Mangu High School', county: 'Kiambu', cutoff: 72, capacity: 400, enrolled: 0, pathway: 'STEM', subjects: ['Mathematics','Physics','Chemistry']},
    { id: 5, name: 'Starehe Boys Centre', county: 'Nairobi', cutoff: 71, capacity: 400, enrolled: 0, pathway: 'STEM', subjects: ['Mathematics','Physics','Chemistry']}
  ];
  
  // AUTO ADD 995 MORE SCHOOLS FOR ALL 47 COUNTIES
  const counties = ["Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita Taveta","Garissa","Wajir","Mandera","Marsabit","Isiolo","Meru","Tharaka Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua","Nyeri","Kirinyaga","Muranga","Kiambu","Turkana","West Pokot","Samburu","Trans Nzoia","Uasin Gishu","Elgeyo Marakwet","Nandi","Baringo","Laikipia","Nakuru","Narok","Kajiado","Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia","Siaya","Kisumu","Homa Bay","Migori","Kisii","Nyamira","Nairobi"];
  let nextId = 6;
  counties.forEach(c => {
    schools.push({ id: nextId++, name: `${c} Boys High School`, county: c, cutoff: 60, capacity: 350, enrolled: 0, pathway: 'STEM', subjects: ['Mathematics','Physics','Chemistry']});
    schools.push({ id: nextId++, name: `${c} Girls High School`, county: c, cutoff: 60, capacity: 350, enrolled: 0, pathway: 'Social Sciences', subjects: ['History','Geography','CRE']});
    schools.push({ id: nextId++, name: `${c} Mixed Secondary`, county: c, cutoff: 45, capacity: 300, enrolled: 0, pathway: 'Arts & Sports Science', subjects: ['Music','Art','Sports']});
    schools.push({ id: nextId++, name: `St. ${c} Mixed Day Secondary`, county: c, cutoff: 35, capacity: 200, enrolled: 0, pathway: 'STEM', subjects: ['Mathematics','Agriculture','Biology']});
  });
  // Special Kakamega schools for you
  ["Musingu High School","Kakamega High School","Butere Girls High School","Butere Boys High School","Mumias Boys High","Mumias Girls High","Lubinu Boys High","Shikoti Girls","Shianda Mixed Secondary","Mukumu Boys","Mukumu Girls","Malava Boys","Malava Girls","Kabras Boys","Bunyore Girls","Lirhembe Girls","Sigalagala High School"].forEach(name => {
    schools.push({ id: nextId++, name, county: 'Kakamega', cutoff: 50, capacity: 300, enrolled: 0, pathway: 'STEM', subjects: ['Mathematics','Physics','Chemistry']});
  });
  while(schools.length < 1000){
    let county = counties[schools.length % 47];
    schools.push({ id: nextId++, name: `${county} ${schools.length} Day Secondary`, county, cutoff: 30, capacity: 180, enrolled: 0, pathway: ['STEM','Social Sciences','Arts & Sports Science'][schools.length%3], subjects: ['Mathematics','English','Kiswahili']});
  }
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
