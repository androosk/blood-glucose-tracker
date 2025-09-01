'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import NotificationPrompt from '@/components/notifications/NotificationPrompt'
import { reminderService } from '@/lib/notifications/reminder-service'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Settings, Smartphone, X, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import FeedbackModal from '@/components/FeedbackModal'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [isIOSChrome, setIsIOSChrome] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (!session) {
        router.push('/login')
      } else {
        // Initialize reminder service when user is authenticated
        try {
          await reminderService.initializeReminders()
        } catch (error) {
          console.warn('Failed to initialize reminders:', error)
        }
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session) {
        // Initialize reminders on sign in
        reminderService.initializeReminders().catch(console.warn)
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

    // Detect iOS Chrome
    const checkIOSChrome = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isChrome = /CriOS/.test(navigator.userAgent)
      setIsIOSChrome(isIOS && isChrome)
    }

    checkStandalone()
    checkIOSChrome()

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show banner after 5 seconds if not dismissed
      setTimeout(() => {
        if (!bannerDismissed && !isStandalone) {
          setShowInstallBanner(true)
        }
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    }
  }, [bannerDismissed, isStandalone])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleInstallClick = () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  const dismissBanner = () => {
    setShowInstallBanner(false)
    setBannerDismissed(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationPrompt />
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                GlucoseMojo
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {!isStandalone && (
                <button
                  onClick={handleInstallClick}
                  disabled={!deferredPrompt}
                  className="p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  title={deferredPrompt ? "Install App" : "Install via browser menu"}
                >
                  <Smartphone className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Send Feedback"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
              <Link
                href="/dashboard/settings"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {showInstallBanner && !isStandalone && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {isIOSChrome ? 'Use Safari to install GlucoseMojo' : 'Install GlucoseMojo for quick access'}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {isIOSChrome ? 'Chrome on iOS cannot install PWAs - open in Safari' : 'Add to your home screen for faster glucose tracking'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleInstallClick}
                  disabled={!deferredPrompt}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {isIOSChrome ? 'Use Safari' : 'Install'}
                </button>
                <button
                  onClick={dismissBanner}
                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  )
}