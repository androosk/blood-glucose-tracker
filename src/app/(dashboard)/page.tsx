'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Plus } from 'lucide-react'
import Link from 'next/link'

type Reading = Database['public']['Tables']['readings']['Row']

export default function DashboardPage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchReadings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', `${today}T00:00:00`)
        .lt('recorded_at', `${today}T23:59:59`)
        .order('recorded_at', { ascending: false })

      if (error) {
        console.error('Error fetching readings:', error)
      } else {
        setReadings(data || [])
      }
      setLoading(false)
    }

    fetchReadings()
  }, [supabase])

  const getReadingColor = (value: number) => {
    if (value < 70) return 'text-red-600 bg-red-50'
    if (value <= 140) return 'text-green-600 bg-green-50'
    if (value <= 180) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) {
    return <div className="text-center">Loading today&apos;s readings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Readings</h1>
        <Link
          href="/dashboard/add"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reading
        </Link>
      </div>

      {readings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No readings recorded today</div>
          <Link
            href="/dashboard/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record your first reading
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {readings.map((reading) => (
              <li key={reading.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getReadingColor(reading.value)}`}>
                      {reading.value} mg/dL
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {reading.reading_type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(reading.recorded_at)}
                      </div>
                    </div>
                  </div>
                  {reading.carbs && (
                    <div className="text-sm text-gray-500">
                      {reading.carbs}g carbs
                    </div>
                  )}
                </div>
                {reading.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    {reading.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}