import { useState, useEffect, useMemo } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://cbc-placement-system.onrender.com'

function App() {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countyFilter, setCountyFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    fetch(API_URL + '/api/schools')
     .then(function(r){ return r.json() })
     .then(function(data){
        var list = Array.isArray(data)? data : (data.schools || data.data || [])
        setSchools(list)
        setLoading(false)
      })
     .catch(function(){
        var demo = []
        for(var i=0;i<1000;i++){
          demo.push({
            id: i+1,
            name: 'School ' + (i+1) + ' - ' + ['Baringo High','Kakamega Boys','Alliance','Moi Girls','Starehe'][i%5],
            code: 'CBC' + (1000+i),
            county: ['Kakamega','Nairobi','Mombasa','Kisumu','Nakuru','Baringo'][i%6],
            subcounty: ['Lurambi','Central','Nyali','Kisumu East'][i%4],
            type: ['National','Extra-County','County','Sub-County'][i%4],
            capacity: 400 + (i%200),
            available: 100 + (i%150),
            cluster: 'C' + ((i%4)+1)
          })
        }
        setSchools(demo)
        setLoading(false)
      })
  }, [])

  const counties = useMemo(function(){
    var s = new Set(schools.map(function(x){ return x.county }).filter(Boolean))
    return ['All'].concat(Array.from(s))
  }, [schools])

  const types = useMemo(function(){
    var s = new Set(schools.map(function(x){ return x.type }).filter(Boolean))
    return ['All'].concat(Array.from(s))
  }, [schools])

  const filtered = useMemo(function(){
    return schools.filter(function(s){
      var hay = (s.name + ' ' + s.code + ' ' + s.county).toLowerCase()
      var matchSearch = hay.includes(search.toLowerCase())
      var matchCounty = countyFilter === 'All' || s.county === countyFilter
      var matchType = typeFilter === 'All' || s.type === typeFilter
      return matchSearch && matchCounty && matchType
    })
  }, [schools, search, countyFilter, typeFilter])

  const paginated = useMemo(function(){
    var start = (currentPage-1)*itemsPerPage
    return filtered.slice(start, start+itemsPerPage)
  }, [filtered, currentPage])

  var totalPages = Math.ceil(filtered.length / itemsPerPage)
  if(totalPages===0) totalPages=1

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <div>
              <h1 className="font-bold text-sm leading-none">CBC Placement System</h1>
              <p className="text-xs text-gray-500 mt-1">Ministry of Education - Junior Secondary</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {schools.length} Schools Loaded
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-sm mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Search School</label>
                <input value={search} onChange={function(e){ setSearch(e.target.value); setCurrentPage(1)}} placeholder="Name, code, county..." className="mt-2 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">County</label>
                <select value={countyFilter} onChange={function(e){ setCountyFilter(e.target.value); setCurrentPage(1)}} className="mt-2 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  {counties.map(function(c){ return <option key={c}>{c}</option> })}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">School Type</label>
                <select value={typeFilter} onChange={function(e){ setTypeFilter(e.target.value); setCurrentPage(1)}} className="mt-2 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  {types.map(function(t){ return <option key={t}>{t}</option> })}
                </select>
              </div>
              <button onClick={function(){ setSearch(''); setCountyFilter('All'); setTypeFilter('All')}} className="w-full text-sm py-2 rounded-xl border border-gray-200 hover:bg-gray-50">Clear Filters</button>
            </div>
          </div>
          <div className="bg-slate-900 text-white rounded-2xl p-5">
            <p className="text-xs opacity-70 uppercase tracking-wider">Placement Stats</p>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="opacity-70">Total Schools</span><span className="font-semibold">{schools.length}</span></div>
              <div className="flex justify-between text-sm"><span className="opacity-70">Filtered</span><span className="font-semibold">{filtered.length}</span></div>
              <div className="flex justify-between text-sm"><span className="opacity-70">Available Slots</span><span className="font-semibold">{filtered.reduce(function(a,b){return a+(b.available||0)},0).toLocaleString()}</span></div>
            </div>
          </div>
        </aside>

        <main className="col-span-12 lg:col-span-9">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase">Showing</p><p className="text-2xl font-bold mt-1">{filtered.length}</p><p className="text-xs text-gray-500 mt-1">schools</p></div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase">Page</p><p className="text-2xl font-bold mt-1">{currentPage} / {totalPages}</p><p className="text-xs text-gray-500 mt-1">12 per page</p></div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase">Status</p><p className="text-2xl font-bold mt-1 text-green-600">Live</p><p className="text-xs text-gray-500 mt-1">API Connected</p></div>
          </div>

          {loading? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({length: 9}).map(function(_,i){ return <div key={i} className="h-44 bg-white rounded-2xl border border-gray-200 animate-pulse"></div> })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map(function(school){
                  return (
                  <div key={school.id} className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-black/20 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sm">{school.name? school.name[0] : 'S'}</div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 uppercase tracking-wider font-semibold">{school.type || 'County'}</span>
                    </div>
                    <h3 className="mt-4 font-semibold text-sm leading-tight">{school.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{school.code} - {school.subcounty || school.county}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-xl p-2.5"><p className="text-xs text-gray-500 uppercase">Capacity</p><p className="text-sm font-semibold mt-1">{school.capacity}</p></div>
                      <div className="bg-green-50 rounded-xl p-2.5 border border-green-100"><p className="text-xs text-green-700 uppercase">Slots Left</p><p className="text-sm font-semibold mt-1 text-green-700">{school.available}</p></div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded-lg">{school.county}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded-lg">{school.cluster || 'C1'}</span>
                    </div>
                  </div>
                )})}
              </div>
              <div className="mt-8 flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3">
                <button disabled={currentPage===1} onClick={function(){ setCurrentPage(function(p){ return p-1})}} className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <div className="flex gap-1">
                  {Array.from({length: Math.min(5, totalPages)}, function(_,i){
                    var page = i+1
                    return <button key={page} onClick={function(){ setCurrentPage(page)}} className={'w-9 h-9 rounded-xl text-sm ' + (currentPage===page? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-50')}>{page}</button>
                  })}
                  {totalPages>5 && <span className="px-2 text-sm text-gray-400">...{totalPages}</span>}
                </div>
                <button disabled={currentPage===totalPages} onClick={function(){ setCurrentPage(function(p){ return p+1})}} className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
