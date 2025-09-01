'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, getHours } from 'date-fns'
import { Database } from '@/types/database'

type Reading = Database['public']['Tables']['readings']['Row']

interface PatternAnalysisProps {
  readings: Reading[]
  targetMin?: number
  targetMax?: number
}

export function PatternAnalysis({ readings, targetMin = 70, targetMax = 140 }: PatternAnalysisProps) {
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourReadings = readings.filter(reading => {
      const readingHour = getHours(new Date(reading.recorded_at))
      return readingHour === hour
    })
    
    const avgValue = hourReadings.length > 0 
      ? hourReadings.reduce((sum, reading) => sum + reading.value, 0) / hourReadings.length
      : null
    
    return {
      hour: format(new Date().setHours(hour, 0, 0, 0), 'HH:mm'),
      hourNumber: hour,
      average: avgValue ? Math.round(avgValue * 10) / 10 : null,
      count: hourReadings.length,
      min: hourReadings.length > 0 ? Math.min(...hourReadings.map(r => r.value)) : null,
      max: hourReadings.length > 0 ? Math.max(...hourReadings.map(r => r.value)) : null
    }
  }).filter(data => data.average !== null)

  const getBarColor = (value: number) => {
    if (value < targetMin) return '#EF4444' // Red
    if (value <= targetMax) return '#10B981' // Green
    if (value <= 180) return '#F59E0B' // Yellow
    return '#EF4444' // Red for very high
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{
      value: number
      payload: typeof hourlyData[0]
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${label} - Avg: ${data.average} mg/dL`}</p>
          <p className="text-sm text-gray-600">{`Range: ${data.min} - ${data.max} mg/dL`}</p>
          <p className="text-sm text-gray-600">{`Readings: ${data.count}`}</p>
        </div>
      )
    }
    return null
  }

  if (hourlyData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patterns by Time of Day</h3>
        <div className="text-center text-gray-500 py-8">
          No readings available. Add more readings to see patterns throughout the day.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Patterns by Time of Day</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis 
              domain={[0, 250]}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="average" radius={[4, 4, 0, 0]}>
              {hourlyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.average || 0)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Shows average blood sugar levels by hour of day based on all your readings.
      </div>
    </div>
  )
}