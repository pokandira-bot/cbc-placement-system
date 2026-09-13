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
    fetch(`${API_URL}/api/schools`)
     .then(r => r.json())
     .then(data => {
        const list = Array.isArray(data)? data : data.schools || data.data || []
        setSchools(list)
        setLoading(false)
      })
     .catch(() => {
        setSchools(Array.from({length: 1000}, (_, i) => ({
          id: i+1,
          name: `School ${i+1} - ${['Baringo High','Kakamega Boys','Alliance','Moi Girls Eldoret','Starehe'][i%5]}`,
          code: `CBC${1000+i}`,
          county: ['Kakamega','Nairobi','Mombasa','Kisumu','Nakuru','Baringo'][i%6],
          subcounty: ['Lurambi','Central','Nyali','Kisumu East'][i%4],
          type: ['National','Extra-County','County','Sub-County'][i%4],
          capacity: 400 + (i%200),
          available: 100 + (i%150),
          cluster: `C${(i%4)+1}`
        })))
        setLoading(false)
      })
  }, [])

  const counties = useMemo(() => ['All',...new Set(schools.map(s => s.county).filter(Boolean))], [schools])
  const types = useMemo(() => ['All',...new Set(schools.map(s => s.type).filter(Boolean))], [schools])

  const filtered = useMemo(() => {
    return schools.filter(s => {
      const matchSearch = `${s.name} ${s.code} ${s.county}`.toLowerCase().includes(search.toLowerCase())
      const matchCounty = countyFilter === 'All' || s.county === countyFilter
      const matchType = typeFilter === 'All' || s.type === typeFilter
      return matchSearch && matchCounty && matchType
    })
  }, [schools, search, countyFilter, typeFilter])

  const paginated = useMemo(() => {
    const start = (currentPage-1)*itemsPerPage
    return filtered.slice(start, start+itemsPerPage)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-gray-800">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0f172a] rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <div>
              <h1 className="font-bold text-[15px] leading-none">CBC Placement System</h1>
              <p className="text-[11px] text
