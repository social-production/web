import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import PostPage from './PostPage.jsx'
import CreatePage from './CreatePage.jsx'
import AuthPage from './AuthPage.jsx'
import ChannelPage from './ChannelPage.jsx'
import UserProfile from './UserProfile.jsx'
import CreateChannelPage from './CreateChannelPage.jsx'
import EditProjectPage from './EditProjectPage.jsx'
// New TypeScript pages
import EditProfilePage from './EditProfilePage'
import NetworkSettingsPage from './NetworkSettingsPage'
import ModeratorDashboard from './ModeratorDashboard'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/channel/:name" element={<ChannelPage />} />
        <Route path="/user/:username" element={<UserProfile />} />
        <Route path="/create-channel" element={<CreateChannelPage />} />
        <Route path="/edit-project/:id" element={<EditProjectPage />} />
        {/* New TypeScript pages */}
        <Route path="/settings/profile" element={<EditProfilePage />} />
        <Route path="/settings/network" element={<NetworkSettingsPage />} />
        <Route path="/moderation" element={<ModeratorDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
