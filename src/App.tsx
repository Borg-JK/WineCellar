import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { configured } from './lib/firebase'
import { AppProvider, useApp } from './state/AppContext'
import { Layout } from './components/Layout'
import { FullSpinner } from './components/ui'
import { Login, Onboarding, SetupNeeded } from './pages/Auth'
import { Feed } from './pages/Feed'
import { Explore } from './pages/Explore'
import { WineForm } from './pages/WineForm'
import { WineDetail } from './pages/WineDetail'
import { LogPick, LogWine } from './pages/LogWine'
import { Cellar } from './pages/Cellar'
import { Friends } from './pages/Friends'
import { Profile } from './pages/Profile'
import { StoreDetail } from './pages/StoreDetail'
import { ProducerDetail } from './pages/ProducerDetail'

function Gate() {
  const { user, authReady, profile } = useApp()
  if (!authReady) return <FullSpinner />
  if (!user) return <Login />
  if (profile === undefined) return <FullSpinner />
  if (profile === null) return <Onboarding />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Feed />} />
        <Route path="explore" element={<Explore />} />
        <Route path="wines/new" element={<WineForm />} />
        <Route path="wines/:id" element={<WineDetail />} />
        <Route path="wines/:id/edit" element={<WineForm />} />
        <Route path="log" element={<LogPick />} />
        <Route path="log/:id" element={<LogWine />} />
        <Route path="cellar" element={<Cellar />} />
        <Route path="friends" element={<Friends />} />
        <Route path="profile" element={<Profile />} />
        <Route path="u/:uid" element={<Profile />} />
        <Route path="stores/:id" element={<StoreDetail />} />
        <Route path="producers/:id" element={<ProducerDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  if (!configured) return <SetupNeeded />
  return (
    <BrowserRouter>
      <AppProvider><Gate /></AppProvider>
    </BrowserRouter>
  )
}
