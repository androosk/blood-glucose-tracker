'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

const PRESET_VALUES = [70, 80, 90, 100, 110, 120, 130, 140, 150]

const READING_TYPES = [
  { value: 'fasting', label: 'Fasting', description: 'Before breakfast' },
  { value: 'pre_meal', label: 'Pre-meal', description: 'Before eating' },
  { value: 'post_30', label: 'Post-meal (30min)', description: '30 minutes after eating' },
  { value: 'post_90', label: 'Post-meal (90min)', description: '90 minutes after eating' },
  { value: 'random', label: 'Random', description: 'Any other time' },
]

export default function EditReadingPage() {
  const [value, setValue] = useState<number | ''>('')
  const [readingType, setReadingType] = useState<string>('random')
  const [carbs, setCarbs] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [recordedAt, setRecordedAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const readingId = params.id as string

  useEffect(() => {
    const fetchReading = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('id', readingId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        setError('Reading not found')
        setLoading(false)
        return
      }

      setValue(data.value)
      setReadingType(data.reading_type)
      setCarbs(data.carbs || '')
      setNotes(data.notes || '')
      
      // Format date for datetime-local input
      const date = new Date(data.recorded_at)
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      setRecordedAt(date.toISOString().slice(0, 16))
      
      setLoading(false)
    }

    if (readingId) {
      fetchReading()
    }
  }, [readingId, router, supabase])

  const handlePresetClick = (presetValue: number) => {
    setValue(presetValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return
    
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('readings')
        .update({
          value: Number(value),
          reading_type: readingType as 'pre_meal' | 'post_30' | 'post_90' | 'random' | 'fasting',
          carbs: carbs ? Number(carbs) : null,
          notes: notes.trim() || null,
          recorded_at: new Date(recordedAt).toISOString(),
        })
        .eq('id', readingId)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Failed to update reading')
      setSaving(false)
    }
  }

  const getValueColor = (val: number) => {
    if (val < 70) return 'text-red-600 bg-red-50 border-red-200'
    if (val <= 140) return 'text-green-600 bg-green-50 border-green-200'
    if (val <= 180) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">Loading reading...</div>
      </div>
    )
  }

  if (error && !value) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center text-red-600">{error}</div>
        <div className="text-center mt-4">
          <Link href="/dashboard" className="text-emerald-600 hover:text-emerald-700">
            Back to Dashboard
          </Link>
        </div>
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Blood Sugar Reading</h1>
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

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving || !value}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Update Reading'}
          </button>
          <Link
            href="/dashboard"
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}