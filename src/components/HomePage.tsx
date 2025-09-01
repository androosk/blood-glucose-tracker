'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Activity, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        router.push('/dashboard')
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  useEffect(() => {
    // Check if app is running as installed PWA
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              Boolean((window.navigator as { standalone?: boolean })?.standalone) ||
                              document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
    }

    checkStandalone()

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    setDeferredPrompt(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-emerald-600 p-4 rounded-full">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            GlucoseMojo
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Take control of your health with smart blood sugar monitoring, 
            automated reminders, and insightful analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-600 dark:border-emerald-400 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            >
              Sign In
            </Link>
          </div>

          {!isStandalone && (
            <div className="mb-8">
              <button
                onClick={handleInstallClick}
                disabled={!deferredPrompt}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
              >
                <Smartphone className="h-5 w-5" />
                {deferredPrompt ? 'Install App' : 'Install Available in Browser Menu'}
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Quick Entry</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Log your readings in seconds with preset buttons and smart reminders
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Smart Reminders</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Never miss a reading with customizable notifications and meal tracking
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Insights</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Visualize patterns and trends to better understand your health
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}