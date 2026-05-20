import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Eye, EyeOff } from 'lucide-react'
import { login } from '../api/auth'
import { setToken, getToken } from '../api/token'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Si ya hay sesión, redirigir
  if (getToken()) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Completá todos los campos'); return }
    setLoading(true)
    setError('')
    try {
      const data = await login(email, password)
      setToken(data.token, rememberMe)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F7FAFC' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#CFE6F7] flex items-center justify-center mb-3 shadow-sm">
            <ChefHat size={28} color="#1F2937" strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-bold text-[#1F2937]">Popipastelería</h1>
          <p className="text-sm text-[#6B7280] mt-1">Ingresá a tu cuenta</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Email</label>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                className="w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white"
                placeholder="admin@popipasteleria.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 pr-10 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CC6EA] hover:text-[#6B7280] transition-colors"
                >
                  {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#E5EAF1] text-[#1F2937] accent-[#1F2937] cursor-pointer"
              />
              <span className="text-sm text-[#6B7280]">Recordarme</span>
            </label>

            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1F2937] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
