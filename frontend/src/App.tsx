import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Diary from '@/pages/Diary'
import Recipes from '@/pages/Recipes'
import Goals from '@/pages/Goals'
import MealPlanner from '@/pages/MealPlanner'
import WeekPlanner from '@/pages/WeekPlanner'
import Foods from '@/pages/Foods'
import Preferences from '@/pages/Preferences'
import AiChat from '@/pages/AiChat'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="nutriplan-theme">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/foods" element={<Foods />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/week-planner" element={<WeekPlanner />} />
            <Route path="/ai-chat" element={<AiChat />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
