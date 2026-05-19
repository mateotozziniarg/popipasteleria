import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Eventos', path: '/' },
  { label: 'Pedidos', path: '/pedidos' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed top-4 left-4 z-50 flex flex-col justify-center items-center w-9 h-9 gap-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Menú"
      >
        <span className={`block w-4.5 h-0.5 bg-gray-700 transition-transform origin-center ${open ? 'translate-y-2 rotate-45' : ''}`} />
        <span className={`block w-4.5 h-0.5 bg-gray-700 transition-opacity ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-4.5 h-0.5 bg-gray-700 transition-transform origin-center ${open ? '-translate-y-2 -rotate-45' : ''}`} />
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" />}

      {/* Sidebar panel */}
      <div
        ref={ref}
        className={`fixed top-0 left-0 z-40 h-full w-full sm:w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pt-16 pb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navegación</p>
          <nav className="flex flex-col gap-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.path
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
