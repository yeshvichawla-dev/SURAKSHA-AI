import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import NavApp from './pages/NavApp'
import Community from './pages/Community'
import HazardDetail from './pages/HazardDetail'
import Admin from './pages/Admin'
import About from './pages/About'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-ink text-fog">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<NavApp />} />
          <Route path="/community" element={<Community />} />
          <Route path="/hazard/:id" element={<HazardDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<p className="p-10 text-center text-mute">Page not found.</p>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
