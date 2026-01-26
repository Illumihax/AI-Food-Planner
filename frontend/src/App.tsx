import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Diary from '@/pages/Diary'
import Recipes from '@/pages/Recipes'
import Goals from '@/pages/Goals'
import MealPlanner from '@/pages/MealPlanner'
import AiChat from '@/pages/AiChat'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="nutriplan-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/ai-chat" element={<AiChat />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
