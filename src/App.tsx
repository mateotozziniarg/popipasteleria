import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import EventosPage from './pages/EventosPage'
import EventoPage from './pages/EventoPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<EventosPage />} />
          <Route path="/eventos/:id" element={<EventoPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
