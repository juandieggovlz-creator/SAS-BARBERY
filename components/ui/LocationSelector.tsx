'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown, Check, X, Search } from 'lucide-react'
import { searchDepartments, searchCities, getCitiesForDepartment } from '@/lib/colombia-data'

interface LocationSelectorProps {
  department: string
  city: string
  onDepartmentChange: (department: string) => void
  onCityChange: (city: string) => void
  isDark?: boolean
  required?: boolean
  departmentLabel?: string
  cityLabel?: string
}

export default function LocationSelector({
  department,
  city,
  onDepartmentChange,
  onCityChange,
  isDark = true,
  required = true,
  departmentLabel = 'Departamento *',
  cityLabel = 'Ciudad / Municipio *'
}: LocationSelectorProps) {
  // Department Combobox State
  const [deptSearch, setDeptSearch] = useState(department || '')
  const [deptOpen, setDeptOpen] = useState(false)
  const [deptHighlight, setDeptHighlight] = useState(0)
  const deptContainerRef = useRef<HTMLDivElement>(null)
  const deptInputRef = useRef<HTMLInputElement>(null)

  // City Combobox State
  const [citySearch, setCitySearch] = useState(city || '')
  const [cityOpen, setCityOpen] = useState(false)
  const [cityHighlight, setCityHighlight] = useState(0)
  const cityContainerRef = useRef<HTMLDivElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)

  // Synchronize when external props change
  useEffect(() => {
    setDeptSearch(department || '')
  }, [department])

  useEffect(() => {
    setCitySearch(city || '')
  }, [city])

  // Filtered lists
  const filteredDepartments = searchDepartments(deptSearch)
  const availableCities = getCitiesForDepartment(department)
  const filteredCities = searchCities(department, citySearch)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (deptContainerRef.current && !deptContainerRef.current.contains(e.target as Node)) {
        setDeptOpen(false)
        // If not selected exact match, revert to current prop
        setDeptSearch(department || '')
      }
      if (cityContainerRef.current && !cityContainerRef.current.contains(e.target as Node)) {
        setCityOpen(false)
        // If not selected exact match, revert to current prop
        setCitySearch(city || '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [department, city])

  // Handle Department Selection
  const selectDepartment = (selectedDept: string) => {
    onDepartmentChange(selectedDept)
    setDeptSearch(selectedDept)
    setDeptOpen(false)
    setDeptHighlight(0)

    // Check if current city is in the new department
    const newCities = getCitiesForDepartment(selectedDept)
    if (!newCities.includes(city)) {
      onCityChange('')
      setCitySearch('')
    }

    // Auto open city selector
    setTimeout(() => {
      cityInputRef.current?.focus()
      setCityOpen(true)
    }, 120)
  }

  // Handle City Selection
  const selectCity = (selectedCity: string) => {
    onCityChange(selectedCity)
    setCitySearch(selectedCity)
    setCityOpen(false)
    setCityHighlight(0)
  }

  // Clear handlers
  const clearDepartment = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDepartmentChange('')
    setDeptSearch('')
    onCityChange('')
    setCitySearch('')
    setDeptOpen(true)
    deptInputRef.current?.focus()
  }

  const clearCity = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCityChange('')
    setCitySearch('')
    setCityOpen(true)
    cityInputRef.current?.focus()
  }

  // Keyboard navigation for department
  const handleDeptKeyDown = (e: React.KeyboardEvent) => {
    if (!deptOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setDeptOpen(true)
        return
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setDeptHighlight(prev => (prev + 1) % (filteredDepartments.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDeptHighlight(prev => (prev - 1 + filteredDepartments.length) % (filteredDepartments.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredDepartments.length > 0 && filteredDepartments[deptHighlight]) {
        selectDepartment(filteredDepartments[deptHighlight])
      }
    } else if (e.key === 'Escape') {
      setDeptOpen(false)
      setDeptSearch(department || '')
    }
  }

  // Keyboard navigation for city
  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (!cityOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setCityOpen(true)
        return
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCityHighlight(prev => (prev + 1) % (filteredCities.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCityHighlight(prev => (prev - 1 + filteredCities.length) % (filteredCities.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCities.length > 0 && filteredCities[cityHighlight]) {
        selectCity(filteredCities[cityHighlight])
      }
    } else if (e.key === 'Escape') {
      setCityOpen(false)
      setCitySearch(city || '')
    }
  }

  // Style classes based on dark/light mode
  const labelClass = isDark
    ? 'block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2'
    : 'block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2'

  const inputClass = isDark
    ? 'w-full pl-10 pr-9 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-750 focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all'
    : 'w-full pl-10 pr-9 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-all'

  const dropdownClass = isDark
    ? 'absolute z-50 mt-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1 text-sm'
    : 'absolute z-50 mt-1.5 w-full bg-white border border-zinc-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1 text-sm'

  const itemClass = (active: boolean, selected: boolean) => {
    if (selected) {
      return isDark
        ? 'bg-amber-500/15 text-amber-300 font-bold px-3.5 py-2.5 flex items-center justify-between cursor-pointer'
        : 'bg-zinc-900 text-white font-bold px-3.5 py-2.5 flex items-center justify-between cursor-pointer'
    }
    if (active) {
      return isDark
        ? 'bg-zinc-800 text-white font-medium px-3.5 py-2.5 flex items-center justify-between cursor-pointer'
        : 'bg-zinc-100 text-zinc-900 font-medium px-3.5 py-2.5 flex items-center justify-between cursor-pointer'
    }
    return isDark
      ? 'text-zinc-300 hover:bg-zinc-800/80 px-3.5 py-2.5 flex items-center justify-between cursor-pointer'
      : 'text-zinc-700 hover:bg-zinc-50 px-3.5 py-2.5 flex items-center justify-between cursor-pointer'
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* ── Departamento ─────────────────────────────────────────────────── */}
      <div className="relative" ref={deptContainerRef}>
        <label className={labelClass}>
          {departmentLabel}
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={deptInputRef}
            type="text"
            required={required}
            value={deptSearch}
            onChange={(e) => {
              setDeptSearch(e.target.value)
              setDeptOpen(true)
              setDeptHighlight(0)
            }}
            onFocus={() => {
              setDeptOpen(true)
            }}
            onKeyDown={handleDeptKeyDown}
            placeholder="Escribe o selecciona (ej. Antioquia)..."
            className={inputClass}
            autoComplete="off"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {department && (
              <button
                type="button"
                onClick={clearDepartment}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md transition-colors"
                title="Limpiar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setDeptOpen(!deptOpen)
                deptInputRef.current?.focus()
              }}
              className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${deptOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dropdown Departamentos */}
        {deptOpen && (
          <div className={dropdownClass}>
            {filteredDepartments.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 text-center flex items-center justify-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>No se encontró ningún departamento</span>
              </div>
            ) : (
              filteredDepartments.map((deptName, index) => {
                const isSelected = department === deptName
                const isHighlighted = deptHighlight === index
                return (
                  <div
                    key={deptName}
                    onClick={() => selectDepartment(deptName)}
                    onMouseEnter={() => setDeptHighlight(index)}
                    className={itemClass(isHighlighted, isSelected)}
                  >
                    <span>{deptName}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* ── Ciudad / Municipio ────────────────────────────────────────────── */}
      <div className="relative" ref={cityContainerRef}>
        <label className={labelClass}>
          {cityLabel}
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={cityInputRef}
            type="text"
            required={required}
            disabled={!department}
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value)
              setCityOpen(true)
              setCityHighlight(0)
            }}
            onFocus={() => {
              if (department) setCityOpen(true)
            }}
            onKeyDown={handleCityKeyDown}
            placeholder={
              department
                ? `Escribe o selecciona ciudad de ${department}...`
                : 'Primero elige un departamento...'
            }
            className={`${inputClass} ${!department ? 'opacity-50 cursor-not-allowed' : ''}`}
            autoComplete="off"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {city && (
              <button
                type="button"
                onClick={clearCity}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md transition-colors"
                title="Limpiar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              disabled={!department}
              onClick={() => {
                if (department) {
                  setCityOpen(!cityOpen)
                  cityInputRef.current?.focus()
                }
              }}
              className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md transition-colors disabled:opacity-40"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${cityOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dropdown Ciudades */}
        {cityOpen && department && (
          <div className={dropdownClass}>
            {filteredCities.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 text-center flex items-center justify-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>No se encontró ninguna ciudad en {department}</span>
              </div>
            ) : (
              filteredCities.map((cityName, index) => {
                const isSelected = city === cityName
                const isHighlighted = cityHighlight === index
                return (
                  <div
                    key={cityName}
                    onClick={() => selectCity(cityName)}
                    onMouseEnter={() => setCityHighlight(index)}
                    className={itemClass(isHighlighted, isSelected)}
                  >
                    <span>{cityName}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
