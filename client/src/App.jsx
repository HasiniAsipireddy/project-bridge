import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Nav } from './components/Nav'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { MyRequests } from './pages/MyRequests'
import { NotFound } from './pages/NotFound'
import { ProjectDetail } from './pages/ProjectDetail'
import { ProjectList } from './pages/ProjectList'
import { Profile } from './pages/Profile'
import { Register } from './pages/Register'
import './App.css'
import './styles.css'

function App() {
  return (
    <BrowserRouter>
      {/* Inside the router so Nav and the pages can both use its hooks. */}
      <AuthProvider>
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="innovator">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-requests"
              element={
                <ProtectedRoute role="student">
                  <MyRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute role="student">
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
