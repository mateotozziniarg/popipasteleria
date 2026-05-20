import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, ShoppingCart, Users } from 'lucide-react'

const navItems = [
  { label: 'Inicio', path: '/', icon: Zap },
  { label: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
  { label: 'Clientes', path: '/clientes', icon: Users },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white border-t border-[#E5EAF1] flex items-end pb-safe">
      {navItems.map(({ label, path, icon: Icon }) => {
        const active = pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center pt-2 pb-3 gap-0.5"
          >
            <div className={`p-2 rounded-2xl transition-colors ${active ? 'bg-[#CFE6F7]' : ''}`}>
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
                className={active ? 'text-[#1F2937]' : 'text-[#9CC6EA]'}
              />
            </div>
            <span className={`text-[10px] leading-tight transition-colors ${active ? 'text-[#1F2937] font-semibold' : 'text-[#9CC6EA]'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
