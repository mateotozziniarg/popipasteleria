import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import BottomNav from './components/BottomNav'
import WorkspacePage from './pages/WorkspacePage'
import EventosPage from './pages/EventosPage'
import EventoPage from './pages/EventoPage'
import PedidosPage from './pages/PedidosPage'
import ProductosPage from './pages/ProductosPage'
import MateriasPrimasPage from './pages/MateriasPrimasPage'
import ClientesPage from './pages/ClientesPage'
import GastosPage from './pages/GastosPage'
import CalendarioPage from './pages/CalendarioPage'
import PropuestasPage from './pages/PropuestasPage'
import PropuestaPage from './pages/PropuestaPage'
import ChatPage from './pages/ChatPage'
import CatWalker from './components/CatWalker'
import ChatWidget from './components/ChatWidget'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen">
                <Sidebar />
                <BottomNav />
                <CatWalker />
                <ChatWidget />
              <div className="overflow-x-hidden pb-20 sm:pb-0">
                  <Routes>
                    <Route path="/" element={<WorkspacePage />} />
                    <Route path="/eventos" element={<EventosPage />} />
                    <Route path="/eventos/:id" element={<EventoPage />} />
                    <Route path="/pedidos" element={<PedidosPage />} />
                    <Route path="/productos" element={<ProductosPage />} />
                    <Route path="/materias-primas" element={<MateriasPrimasPage />} />
                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/gastos" element={<GastosPage />} />
                    <Route path="/calendario" element={<CalendarioPage />} />
                    <Route path="/propuestas" element={<PropuestasPage />} />
                    <Route path="/propuestas/:id" element={<PropuestaPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
