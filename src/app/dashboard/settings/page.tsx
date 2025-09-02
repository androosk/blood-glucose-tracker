'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { ArrowLeft, Bell, TestTube, Save, Moon } from 'lucide-react'
import Link from 'next/link'
import { NotificationStatus } from '@/components/notifications/NotificationPrompt'
import { reminderService } from '@/lib/notifications/reminder-service'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testingNotification, setTestingNotification] = useState(false)
  
  // Form state
  const [reminder1Minutes, setReminder1Minutes] = useState(30)
  const [reminder2Minutes, setReminder2Minutes] = useState(90)
  const [silentStart, setSilentStart] = useState('22:00')
  const [silentEnd, setSilentEnd] = useState('07:00')
  const [targetMin, setTargetMin] = useState(70)
  const [targetMax, setTargetMax] = useState(140)
  const [enableGeneralReminders, setEnableGeneralReminders] = useState(false)
  const [generalReminderMinutes, setGeneralReminderMinutes] = useState(120)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        setError('Failed to load profile')
      } else if (data) {
        setProfile(data)
        setReminder1Minutes(data.reminder_1_minutes)
        setReminder2Minutes(data.reminder_2_minutes)
        setSilentStart(data.silent_start)
        setSilentEnd(data.silent_end)
        setTargetMin(data.target_min)
        setTargetMax(data.target_max)
        setEnableGeneralReminders(data.enable_general_reminders || false)
        setGeneralReminderMinutes(data.general_reminder_minutes || 120)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

  const handleSave = async () => {
    if (!profile) return
    
    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          reminder_1_minutes: reminder1Minutes,
          reminder_2_minutes: reminder2Minutes,
          silent_start: silentStart,
          silent_end: silentEnd,
          target_min: targetMin,
          target_max: targetMax,
          enable_general_reminders: enableGeneralReminders,
          general_reminder_minutes: generalReminderMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) {
        setError(error.message)
      } else {
        // Update local state
        setProfile({
          ...profile,
          reminder_1_minutes: reminder1Minutes,
          reminder_2_minutes: reminder2Minutes,
          silent_start: silentStart,
          silent_end: silentEnd,
          target_min: targetMin,
          target_max: targetMax,
          enable_general_reminders: enableGeneralReminders,
          general_reminder_minutes: generalReminderMinutes,
        })
      }
    } catch {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestNotification = async () => {
    setTestingNotification(true)
    
    try {
      const result = await reminderService.testNotification()
      if (!result.success) {
        setError(result.error || 'Failed to send test notification')
      }
    } catch {
      setError('Failed to send test notification')
    } finally {
      setTestingNotification(false)
    }
  }

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Notification permission denied')
      }
    } catch {
      setError('Failed to request notification permission')
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <ThemeToggle />

        {/* Notification Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </h2>
            <NotificationStatus />
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enable notifications to receive reminders for post-meal blood sugar checks.
            </p>
            
            {Notification?.permission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Enable Notifications
              </button>
            )}
            
            <button
              onClick={handleTestNotification}
              disabled={testingNotification || Notification?.permission !== 'granted'}
              className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <TestTube className="h-4 w-4" />
              {testingNotification ? 'Sending...' : 'Test Notification'}
            </button>
          </div>
        </div>

        {/* Reminder Timing */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reminder Timing
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First reminder (minutes after meal)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={reminder1Minutes}
                onChange={(e) => setReminder1Minutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Second reminder (minutes after meal)
              </label>
              <input
                type="number"
                min="30"
                max="180"
                value={reminder2Minutes}
                onChange={(e) => setReminder2Minutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* General Check-In Reminders */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            General Check-In Reminders
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get reminded to check your blood sugar after a custom interval from your last reading.
          </p>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={enableGeneralReminders}
                onChange={(e) => setEnableGeneralReminders(e.target.checked)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable general check-in reminders
              </span>
            </label>
            
            {enableGeneralReminders && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remind me to check again after (minutes)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGeneralReminderMinutes(30)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                      generalReminderMinutes === 30
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    30 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneralReminderMinutes(90)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                      generalReminderMinutes === 90
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    90 min
                  </button>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={generalReminderMinutes}
                    onChange={(e) => setGeneralReminderMinutes(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Custom minutes"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Between 15 minutes and 8 hours
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Silent Hours */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Silent Hours
          </h2>
          
          <p className="text-sm text-gray-600 mb-4">
            Notifications during these hours will be delayed until the silent period ends.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Silent hours start
              </label>
              <input
                type="time"
                value={silentStart}
                onChange={(e) => setSilentStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Silent hours end
              </label>
              <input
                type="time"
                value={silentEnd}
                onChange={(e) => setSilentEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Target Range */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Target Blood Sugar Range (mg/dL)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum target
              </label>
              <input
                type="number"
                min="50"
                max="200"
                value={targetMin}
                onChange={(e) => setTargetMin(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum target
              </label>
              <input
                type="number"
                min="80"
                max="250"
                value={targetMax}
                onChange={(e) => setTargetMax(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Low: &lt; {targetMin}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Target: {targetMin} - {targetMax}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>High: {targetMax} - 180</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Very High: &gt; 180</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}