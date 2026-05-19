import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Calendar, ShoppingCart, Package } from 'lucide-react'

const navItems = [
  { label: 'Eventos', path: '/', icon: Calendar },
  { label: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
  { label: 'Productos', path: '/productos', icon: Package },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

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

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="fixed top-4 left-4 z-50 flex items-center justify-center w-9 h-9 bg-white border border-[#E5EAF1] rounded-lg shadow-sm hover:bg-[#F7FAFC] transition-colors"
        aria-label="Menú"
      >
        {open
          ? <X size={16} color="#1F2937" strokeWidth={2} />
          : <Menu size={16} color="#1F2937" strokeWidth={2} />
        }
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" />}

      <div
        ref={ref}
        className={`fixed top-0 left-0 z-40 h-full w-full sm:w-64 bg-white border-r border-[#E5EAF1] shadow-lg transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pt-16 pb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg bg-[#CFE6F7] flex items-center justify-center">
                <ShoppingCart size={14} color="#1F2937" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-[#1F2937]">Popipastelería</span>
            </div>
            <p className="text-xs text-[#6B7280] pl-9">Admin de pedidos</p>
          </div>

          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Navegación</p>
          <nav className="flex flex-col gap-1">
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
        </div>
      </div>
    </>
  )
}
