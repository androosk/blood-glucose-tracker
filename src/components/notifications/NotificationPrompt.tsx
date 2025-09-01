'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, X } from 'lucide-react'

interface NotificationPromptProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

export default function NotificationPrompt({ 
  onPermissionGranted, 
  onPermissionDenied 
}: NotificationPromptProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [showPrompt, setShowPrompt] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      // Show prompt if permission hasn't been decided yet
      if (Notification.permission === 'default') {
        // Delay showing prompt to let user see the app first
        const timer = setTimeout(() => setShowPrompt(true), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications')
      return
    }

    setIsRequesting(true)
    
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      setShowPrompt(false)
      
      if (permission === 'granted') {
        // Test notification
        new Notification('Blood Sugar Tracker', {
          body: 'Notifications enabled! You\'ll get reminders for your readings.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png'
        })
        onPermissionGranted?.()
      } else {
        onPermissionDenied?.()
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem('notification-prompt-dismissed', 'true')
  }

  // Don't show if notifications aren't supported
  if (!('Notification' in window)) {
    return null
  }

  // Don't show if already granted or denied, or if user dismissed it
  if (permission !== 'default' || !showPrompt) {
    return null
  }

  // Don't show if user previously dismissed
  if (localStorage.getItem('notification-prompt-dismissed')) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Bell className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Enable Reminders
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get reminded to check your blood sugar 30 and 90 minutes after meals. 
              Never miss a reading again!
            </p>
            <div className="flex gap-2">
              <button
                onClick={requestPermission}
                disabled={isRequesting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
              >
                {isRequesting ? 'Enabling...' : 'Enable Notifications'}
              </button>
              <button
                onClick={dismissPrompt}
                className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
          <button
            onClick={dismissPrompt}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Status component to show current notification status
export function NotificationStatus() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  if (!('Notification' in window)) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <BellOff className="h-4 w-4" />
        Notifications not supported
      </div>
    )
  }

  const getStatusColor = () => {
    switch (permission) {
      case 'granted': return 'text-green-600'
      case 'denied': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getStatusText = () => {
    switch (permission) {
      case 'granted': return 'Notifications enabled'
      case 'denied': return 'Notifications blocked'
      default: return 'Notifications not set up'
    }
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
      {permission === 'granted' ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {getStatusText()}
    </div>
  )
}