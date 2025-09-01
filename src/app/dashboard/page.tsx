'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Plus, Edit2, Trash2, Download } from 'lucide-react'
import Link from 'next/link'
import { DailyChart } from '@/components/charts/DailyChart'
import { WeeklyTrend } from '@/components/charts/WeeklyTrend'
import { PatternAnalysis } from '@/components/charts/PatternAnalysis'
import { MealCorrelation } from '@/components/charts/MealCorrelation'
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns'

type Reading = Database['public']['Tables']['readings']['Row']

export default function DashboardPage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [allReadings, setAllReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today')
  const [profile, setProfile] = useState<{ target_min: number; target_max: number } | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user profile for target ranges
      const { data: profileData } = await supabase
        .from('profiles')
        .select('target_min, target_max')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)

      // Get date range based on filter
      let startDate: Date
      let endDate: Date
      
      switch (timeFilter) {
        case 'week':
          startDate = startOfWeek(new Date())
          endDate = endOfWeek(new Date())
          break
        case 'month':
          startDate = startOfMonth(new Date())
          endDate = endOfMonth(new Date())
          break
        default: // today
          startDate = startOfDay(new Date())
          endDate = endOfDay(new Date())
      }

      // Fetch filtered readings
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString())
        .order('recorded_at', { ascending: false })

      // Also fetch all readings for charts
      const { data: allData } = await supabase
        .from('readings')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1000)

      if (error) {
        console.error('Error fetching readings:', error)
      } else {
        setReadings(data || [])
        setAllReadings(allData || [])
      }
      setLoading(false)
    }

    fetchData()
  }, [supabase, timeFilter])

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

  const formatReadingType = (type: string) => {
    const typeMap: Record<string, string> = {
      'fasting': 'Fasting',
      'pre_meal': 'Pre-meal',
      'post_30': '30min post-meal',
      'post_90': '90min post-meal',
      'random': 'Random'
    }
    return typeMap[type] || type
  }

  const getReadingStats = () => {
    if (readings.length === 0) return null
    
    const values = readings.map(r => r.value)
    const avg = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    return { avg, min, max, count: readings.length }
  }

  const stats = getReadingStats()

  const getFilteredChartData = () => {
    switch (timeFilter) {
      case 'today':
        return readings
      case 'week':
        const weekStart = startOfWeek(new Date())
        return allReadings.filter(r => new Date(r.recorded_at) >= weekStart)
      case 'month':
        const monthStart = startOfMonth(new Date())
        return allReadings.filter(r => new Date(r.recorded_at) >= monthStart)
      default:
        return readings
    }
  }

  const getFilterTitle = () => {
    switch (timeFilter) {
      case 'week': return 'This Week\'s Readings'
      case 'month': return 'This Month\'s Readings'
      default: return 'Today\'s Readings'
    }
  }

  const handleDelete = async (readingId: string) => {
    if (!confirm('Are you sure you want to delete this reading?')) return
    
    const { error } = await supabase
      .from('readings')
      .delete()
      .eq('id', readingId)
    
    if (error) {
      alert('Failed to delete reading')
    } else {
      setReadings(readings.filter(r => r.id !== readingId))
      setAllReadings(allReadings.filter(r => r.id !== readingId))
    }
  }

  const handleExport = async (exportFormat: 'csv' | 'json') => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ format: exportFormat })
      
      if (timeFilter !== 'today') {
        const now = new Date()
        let startDate: Date
        
        switch (timeFilter) {
          case 'week':
            startDate = startOfWeek(now)
            break
          case 'month':
            startDate = startOfMonth(now)
            break
          default:
            startDate = startOfDay(now)
        }
        
        params.set('startDate', startDate.toISOString())
        params.set('endDate', endOfDay(now).toISOString())
      }
      
      const response = await fetch(`/api/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `blood-sugar-readings-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setShowExportModal(false)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{getFilterTitle()}</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setTimeFilter('today')}
              className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium rounded-l-md border ${
                timeFilter === 'today' 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium border-t border-b ${
                timeFilter === 'week' 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium rounded-r-md border ${
                timeFilter === 'month' 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Month
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <Link
              href="/dashboard/add"
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Reading</span>
            </Link>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">{timeFilter === 'today' ? "Today's Avg" : timeFilter === 'week' ? "Weekly Avg" : "Monthly Avg"}</div>
            <div className={`text-xl sm:text-2xl font-bold ${getReadingColor(stats.avg).split(' ')[0]}`}>
              {stats.avg}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Lowest</div>
            <div className={`text-xl sm:text-2xl font-bold ${getReadingColor(stats.min).split(' ')[0]}`}>
              {stats.min}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Highest</div>
            <div className={`text-xl sm:text-2xl font-bold ${getReadingColor(stats.max).split(' ')[0]}`}>
              {stats.max}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Total</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.count}</div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {timeFilter === 'today' ? (
            <DailyChart 
              readings={readings} 
              targetMin={profile?.target_min} 
              targetMax={profile?.target_max} 
            />
          ) : (
            <WeeklyTrend 
              readings={getFilteredChartData()} 
              targetMin={profile?.target_min} 
              targetMax={profile?.target_max} 
            />
          )}
          
          <PatternAnalysis 
            readings={allReadings} 
            targetMin={profile?.target_min} 
            targetMax={profile?.target_max} 
          />
        </div>

        {/* Meal Correlation Chart */}
        <div className="w-full">
          <MealCorrelation 
            readings={allReadings} 
            targetMin={profile?.target_min} 
            targetMax={profile?.target_max} 
          />
        </div>
      </div>

      {readings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">No readings recorded {timeFilter === 'today' ? 'today' : timeFilter === 'week' ? 'this week' : 'this month'}</div>
          <Link
            href="/dashboard/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record your first reading
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {readings.map((reading) => (
              <li key={reading.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getReadingColor(reading.value)}`}>
                      {reading.value} mg/dL
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatReadingType(reading.reading_type)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(reading.recorded_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {reading.carbs && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {reading.carbs}g carbs
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/edit/${reading.id}`}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(reading.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {reading.notes && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {reading.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Export Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Export your {getFilterTitle().toLowerCase()} data in your preferred format.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {exporting ? 'Exporting...' : 'CSV'}
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {exporting ? 'Exporting...' : 'JSON'}
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}