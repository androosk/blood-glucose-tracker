'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { reminderService } from '@/lib/notifications/reminder-service'

const PRESET_VALUES = [70, 80, 90, 100, 110, 120, 130, 140, 150]

const READING_TYPES = [
  { value: 'fasting', label: 'Fasting', description: 'Before breakfast' },
  { value: 'pre_meal', label: 'Pre-meal', description: 'Before eating' },
  { value: 'post_30', label: 'Post-meal (30min)', description: '30 minutes after eating' },
  { value: 'post_90', label: 'Post-meal (90min)', description: '90 minutes after eating' },
  { value: 'random', label: 'Random', description: 'Any other time' },
]

export default function AddReadingPage() {
  const [value, setValue] = useState<number | ''>('')
  const [readingType, setReadingType] = useState<string>('random')
  const [carbs, setCarbs] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [recordedAt, setRecordedAt] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Initialize form from URL parameters (e.g., from notifications)
  useEffect(() => {
    const typeFromUrl = searchParams.get('type')
    if (typeFromUrl && ['fasting', 'pre_meal', 'post_30', 'post_90', 'random'].includes(typeFromUrl)) {
      setReadingType(typeFromUrl)
    }
  }, [searchParams])

  const handlePresetClick = (presetValue: number) => {
    setValue(presetValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return
    
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const { data: insertData, error: insertError } = await supabase
        .from('readings')
        .insert({
          user_id: user.id,
          value: Number(value),
          reading_type: readingType as 'pre_meal' | 'post_30' | 'post_90' | 'random' | 'fasting',
          carbs: carbs ? Number(carbs) : null,
          notes: notes.trim() || null,
          recorded_at: new Date(recordedAt).toISOString(),
        })
        .select()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
      } else if (insertData && insertData[0]) {
        const newReading = insertData[0]
        
        // Schedule reminders if this is a pre-meal reading
        if (readingType === 'pre_meal') {
          try {
            const mealTime = new Date(recordedAt)
            await reminderService.schedulePostMealReminders(
              newReading.id,
              user.id,
              mealTime
            )
          } catch (reminderError) {
            console.warn('Failed to schedule reminders:', reminderError)
            // Don't block the main flow if reminder scheduling fails
          }
        }
        
        router.push('/dashboard')
      }
    } catch {
      setError('Failed to save reading')
      setLoading(false)
    }
  }

  const getValueColor = (val: number) => {
    if (val < 70) return 'text-red-600 bg-red-50 border-red-200'
    if (val <= 140) return 'text-green-600 bg-green-50 border-green-200'
    if (val <= 180) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
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
        <h1 className="text-2xl font-bold text-gray-900">Add Blood Sugar Reading</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Entry Buttons */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Quick Entry (mg/dL)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PRESET_VALUES.map((presetValue) => (
              <button
                key={presetValue}
                type="button"
                onClick={() => handlePresetClick(presetValue)}
                className={`p-3 rounded-lg border-2 font-medium transition-all ${
                  value === presetValue
                    ? getValueColor(presetValue)
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {presetValue}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or Enter Manually
          </label>
          <input
            type="number"
            min="20"
            max="600"
            value={value}
            onChange={(e) => setValue(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Blood sugar value"
          />
        </div>

        {/* Reading Type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Reading Type
          </label>
          <div className="space-y-2">
            {READING_TYPES.map((type) => (
              <label key={type.value} className="flex items-center">
                <input
                  type="radio"
                  name="readingType"
                  value={type.value}
                  checked={readingType === type.value}
                  onChange={(e) => setReadingType(e.target.value)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Carbs (optional) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Carbohydrates (optional)
          </label>
          <input
            type="number"
            min="0"
            max="500"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Grams of carbs"
          />
        </div>

        {/* Time */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline h-4 w-4 mr-1" />
            Reading Time
          </label>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="How are you feeling? What did you eat?"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !value}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Saving...' : 'Save Reading'}
        </button>
      </form>
    </div>
  )
}