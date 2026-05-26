import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Zap, Calendar, ShoppingCart, Package, FlaskConical, Users, ChefHat, Plus, LogOut, Thermometer, Droplets, Receipt, CloudFog, CalendarDays, Sparkles, MessageSquare } from 'lucide-react'
import { clearToken } from '../api/token'

const navItems = [
  { label: 'Inicio', path: '/', icon: Zap },
  { label: 'Eventos', path: '/eventos', icon: Calendar },
  { label: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
  { label: 'Clientes', path: '/clientes', icon: Users },
  { label: 'Productos', path: '/productos', icon: Package },
  { label: 'Materias primas', path: '/materias-primas', icon: FlaskConical },
  { label: 'Gastos', path: '/gastos', icon: Receipt },
  { label: 'Calendario', path: '/calendario', icon: CalendarDays },
  { label: 'Propuestas', path: '/propuestas', icon: Sparkles },
  { label: 'Chat IA', path: '/chat', icon: MessageSquare },
]

interface Clima {
  temperatura: number
  humedad: number
  rocio: number
}

function colorRocio(r: number) {
  if (r < 10) return 'text-emerald-600'
  if (r <= 15) return 'text-amber-600'
  return 'text-red-500'
}

function textoRocio(r: number) {
  if (r < 10) return 'Condiciones ideales para trabajar chocolate, merengues y macarons.'
  if (r <= 15) return 'Precaución: el chocolate puede costar más templar y los merengues absorber humedad.'
  return 'Difícil para pastelería fina: riesgo de bloom en chocolate, merengues caídos y macarons pegajosos.'
}

async function fetchClima(): Promise<Clima> {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m,relative_humidity_2m,dew_point_2m&timezone=America%2FArgentina%2FBuenos_Aires'
  const res = await fetch(url)
  const data = await res.json()
  return {
    temperatura: Math.round(data.current.temperature_2m),
    humedad: data.current.relative_humidity_2m,
    rocio: Math.round(data.current.dew_point_2m),
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
      <header
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3"
        style={{
          background: 'linear-gradient(to bottom, var(--cream-0), color-mix(in oklab, var(--cream-0), white 25%))',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <button
          ref={btnRef}
          onClick={() => setOpen(o => !o)}
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors shrink-0"
          style={{ color: 'var(--ink-2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream-1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Menú"
        >
          {open
            ? <X size={18} strokeWidth={2} />
            : <Menu size={18} strokeWidth={2} />
          }
        </button>

        {/* Brand */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0"
          style={{
            background: 'white',
            border: '1px solid var(--line)',
            boxShadow: '0 1px 2px rgba(42,31,26,0.04)',
          }}
        >
          <ChefHat size={14} strokeWidth={2} style={{ color: 'var(--ink-3)' }} />
          <span
            className="text-sm font-bold hidden sm:inline"
            style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
          >
            Popi<span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>pastelería</span>
          </span>
        </div>

        {/* Clima Buenos Aires */}
        {clima && (
          <div
            className="flex items-center gap-3 px-3 py-1.5 rounded-full"
            style={{
              background: 'white',
              border: '1px solid var(--line)',
              boxShadow: '0 1px 2px rgba(42,31,26,0.04)',
              fontSize: 13,
            }}
          >
            <div className="flex items-center gap-1.5">
              <Thermometer size={12} className="text-rose-500 shrink-0" strokeWidth={2} />
              <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>{clima.temperatura}°</span>
            </div>
            <div style={{ width: 1, height: 12, background: 'var(--line)' }} />
            <div className="flex items-center gap-1.5">
              <Droplets size={12} strokeWidth={2} style={{ color: 'oklch(0.62 0.11 210)' }} />
              <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>{clima.humedad}%</span>
            </div>
            <div style={{ width: 1, height: 12, background: 'var(--line)' }} />
            <div className="relative group">
              <div className="flex items-center gap-1.5 cursor-default">
                <CloudFog size={12} className={`shrink-0 ${colorRocio(clima.rocio)}`} strokeWidth={2} />
                <span className={`font-semibold tabular-nums ${colorRocio(clima.rocio)}`}>{clima.rocio}°</span>
              </div>
              <div
                className="invisible group-hover:visible absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 text-[11px] leading-snug rounded-xl px-3 py-2.5 shadow-xl z-[100] pointer-events-none"
                style={{ background: 'var(--ink)', color: 'var(--cream-0)' }}
              >
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
                  style={{ background: 'var(--ink)' }}
                />
                <p className="font-semibold mb-1">Punto de rocío: {clima.rocio}°C</p>
                <p>{textoRocio(clima.rocio)}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => { navigate('/pedidos?nuevo=1'); setOpen(false) }}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors shrink-0"
          style={{
            background: 'var(--ink)',
            color: 'var(--cream-0)',
            boxShadow: '0 1px 2px rgba(42,31,26,0.12)',
          }}
        >
          <Plus size={12} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nuevo pedido</span>
        </button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setOpen(false)} />}

      <div
        ref={ref}
        className={`fixed top-14 left-0 z-40 h-[calc(100%-3.5rem)] w-64 shadow-xl transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, color-mix(in oklab, var(--cream-0), white 20%), var(--cream-0))',
          borderRight: '1px solid var(--line)',
        }}
      >
        <div className="px-4 pt-6 pb-6 flex flex-col h-full">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.08em] mb-3 px-2"
            style={{ color: 'var(--ink-4)' }}
          >
            Navegación
          </p>
          <nav className="flex flex-col gap-0.5 flex-1">
            {navItems.map(({ label, path, icon: Icon }) => {
              const active = pathname === path
              return (
                <button
                  key={path}
                  onClick={() => goTo(path)}
                  className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3"
                  style={{
                    background: active ? 'var(--ink)' : 'transparent',
                    color: active ? 'var(--cream-0)' : 'var(--ink-2)',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.10), 0 6px 14px -8px rgba(42,31,26,0.45)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--cream-1)'
                      e.currentTarget.style.color = 'var(--ink)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--ink-2)'
                    }
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={2}
                    style={{ color: active ? 'var(--cream-0)' : 'var(--ink-4)' }}
                  />
                  {label}
                </button>
              )
            })}
          </nav>
          <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--line)' }}>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3"
              style={{ color: 'var(--ink-3)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--rose-soft)'
                e.currentTarget.style.color = 'oklch(0.42 0.16 22)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--ink-3)'
              }}
            >
              <LogOut size={16} strokeWidth={2} style={{ color: 'var(--ink-4)' }} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
