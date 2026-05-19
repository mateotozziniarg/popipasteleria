import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
      <Link to="/" className="font-semibold text-gray-900 text-lg tracking-tight">
        Popipastelería
      </Link>
      <div className="flex gap-2 ml-auto">
        <Link
          to="/"
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
            pathname === '/' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Eventos
        </Link>
      </div>
    </nav>
  )
}
