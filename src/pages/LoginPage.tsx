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
    <div className="login-page min-h-screen flex items-center justify-center px-4 relative">
      <style>{`
        .login-page {
          background-image: url(/login-mobile.png);
          background-size: cover;
          background-position: center;
        }
        @media (min-width: 768px) {
          .login-page {
            background-image: url(/login-desktop.png);
            background-size: cover;
            background-position: center;
          }
        }
      `}</style>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center mb-3 shadow-md">
            <ChefHat size={28} color="#2A1F1A" strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-bold text-[#2A1F1A] drop-shadow-sm">Popipastelería</h1>
          <p className="text-sm text-[#7A6A5A] mt-1">Ingresá a tu cuenta</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2A1F1A] mb-1.5">Usuario</label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                className="w-full border border-[#E2D9CC] rounded-xl px-3 py-2.5 text-sm text-[#2A1F1A] placeholder-[#7A6A5A] focus:outline-none focus:ring-2 focus:ring-[#B5A28A] transition-colors bg-white"
                placeholder="tu_usuario"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2A1F1A] mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full border border-[#E2D9CC] rounded-xl px-3 py-2.5 pr-10 text-sm text-[#2A1F1A] placeholder-[#7A6A5A] focus:outline-none focus:ring-2 focus:ring-[#B5A28A] transition-colors bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5A28A] hover:text-[#7A6A5A] transition-colors"
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
                className="w-4 h-4 rounded border-[#E2D9CC] text-[#2A1F1A] accent-[#2A1F1A] cursor-pointer"
              />
              <span className="text-sm text-[#7A6A5A]">Recordarme</span>
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
              className="w-full bg-[#2A1F1A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1A1310] disabled:opacity-40 transition-colors flex items-center justify-center gap-2 mt-1"
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
