import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Zap, Calendar, ShoppingCart, Package, FlaskConical, Users, ChefHat, Plus, LogOut, Thermometer, Droplets } from 'lucide-react'
import { clearToken } from '../api/token'

const navItems = [
  { label: 'Inicio', path: '/', icon: Zap },
  { label: 'Eventos', path: '/eventos', icon: Calendar },
  { label: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
  { label: 'Clientes', path: '/clientes', icon: Users },
  { label: 'Productos', path: '/productos', icon: Package },
  { label: 'Materias primas', path: '/materias-primas', icon: FlaskConical },
]

interface Clima {
  temperatura: number
  humedad: number
}

async function fetchClima(): Promise<Clima> {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m,relative_humidity_2m&timezone=America%2FArgentina%2FBuenos_Aires'
  const res = await fetch(url)
  const data = await res.json()
  return {
    temperatura: Math.round(data.current.temperature_2m),
    humedad: data.current.relative_humidity_2m,
  }
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const [clima, setClima] = useState<Clima | null>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    fetchClima().then(setClima).catch(() => {})
    const interval = setInterval(() => {
      fetchClima().then(setClima).catch(() => {})
    }, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        ref.current && !ref.current.contains(target) &&
        btnRef.current && !btnRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function goTo(path: string) {
    navigate(path)
    setOpen(false)
  }

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
    setOpen(false)
  }

  return (
    <>
      {/* Header bar fija */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-[#E5EAF1] flex items-center px-4 gap-3">
        <button
          ref={btnRef}
          onClick={() => setOpen(o => !o)}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#F7FAFC] transition-colors shrink-0"
          aria-label="Menú"
        >
          {open
            ? <X size={18} color="#1F2937" strokeWidth={2} />
            : <Menu size={18} color="#1F2937" strokeWidth={2} />
          }
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-md bg-[#CFE6F7] flex items-center justify-center">
            <ChefHat size={13} color="#1F2937" strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold text-[#1F2937] hidden sm:inline">Popipastelería</span>
        </div>

        {/* Clima Buenos Aires */}
        {clima && (
          <div className="flex items-center gap-3 ml-2 px-3 py-1.5 rounded-lg bg-[#F7FAFC] border border-[#E5EAF1]">
            <div className="flex items-center gap-1">
              <Thermometer size={13} className="text-rose-400 shrink-0" strokeWidth={2} />
              <span className="text-xs font-semibold text-[#1F2937]">{clima.temperatura}°</span>
            </div>
            <div className="w-px h-3 bg-[#E5EAF1]" />
            <div className="flex items-center gap-1">
              <Droplets size={13} className="text-[#9CC6EA] shrink-0" strokeWidth={2} />
              <span className="text-xs font-semibold text-[#1F2937]">{clima.humedad}%</span>
            </div>
          </div>
        )}

        <button
          onClick={() => { navigate('/pedidos?nuevo=1'); setOpen(false) }}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium text-[#1F2937] bg-[#CFE6F7] hover:bg-[#9CC6EA] px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <Plus size={12} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nuevo pedido</span>
        </button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-black/20" />}

      <div
        ref={ref}
        className={`fixed top-14 left-0 z-40 h-[calc(100%-3.5rem)] w-64 bg-white border-r border-[#E5EAF1] shadow-lg transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pt-6 pb-6 flex flex-col h-full">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Navegación</p>
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map(({ label, path, icon: Icon }) => {
              const active = pathname === path
              return (
                <button
                  key={path}
                  onClick={() => goTo(path)}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                    active
                      ? 'bg-[#CFE6F7] text-[#1F2937]'
                      : 'text-[#6B7280] hover:bg-[#F7FAFC] hover:text-[#1F2937]'
                  }`}
                >
                  <Icon size={16} strokeWidth={2} className={active ? 'text-[#1F2937]' : 'text-[#9CC6EA]'} />
                  {label}
                </button>
              )
            })}
          </nav>
          <div className="pt-4 border-t border-[#E5EAF1] mt-4">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#6B7280] hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-3"
            >
              <LogOut size={16} strokeWidth={2} className="text-[#9CC6EA]" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
