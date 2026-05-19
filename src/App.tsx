import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import EventosPage from './pages/EventosPage'
import EventoPage from './pages/EventoPage'
import PedidosPage from './pages/PedidosPage'
import ProductosPage from './pages/ProductosPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
        <Sidebar />
        <div className="pl-0">
          <Routes>
            <Route path="/" element={<EventosPage />} />
            <Route path="/eventos/:id" element={<EventoPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/productos" element={<ProductosPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
