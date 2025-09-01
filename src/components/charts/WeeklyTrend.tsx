'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, startOfDay, subDays, eachDayOfInterval } from 'date-fns'
import { Database } from '@/types/database'

type Reading = Database['public']['Tables']['readings']['Row']

interface WeeklyTrendProps {
  readings: Reading[]
  targetMin?: number
  targetMax?: number
}

export function WeeklyTrend({ readings, targetMin = 70, targetMax = 140 }: WeeklyTrendProps) {
  const today = new Date()
  const sevenDaysAgo = subDays(today, 6)
  
  const days = eachDayOfInterval({ start: sevenDaysAgo, end: today })
  
  const chartData = days.map(day => {
    const dayStart = startOfDay(day)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    
    const dayReadings = readings.filter(reading => {
      const readingDate = new Date(reading.recorded_at)
      return readingDate >= dayStart && readingDate < dayEnd
    })
    
    const avgValue = dayReadings.length > 0 
      ? dayReadings.reduce((sum, reading) => sum + reading.value, 0) / dayReadings.length
      : null
    
    return {
      date: format(day, 'MMM dd'),
      fullDate: day.toISOString(),
      average: avgValue ? Math.round(avgValue * 10) / 10 : null,
      count: dayReadings.length,
      min: dayReadings.length > 0 ? Math.min(...dayReadings.map(r => r.value)) : null,
      max: dayReadings.length > 0 ? Math.max(...dayReadings.map(r => r.value)) : null
    }
  })

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{
      value: number
      dataKey: string
      payload: typeof chartData[0]
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {data.average && (
            <>
              <p className="text-sm">{`Average: ${data.average} mg/dL`}</p>
              <p className="text-sm text-gray-600">{`Range: ${data.min} - ${data.max} mg/dL`}</p>
              <p className="text-sm text-gray-600">{`Readings: ${data.count}`}</p>
            </>
          )}
          {!data.average && (
            <p className="text-sm text-gray-500">No readings</p>
          )}
        </div>
      )
    }
    return null
  }

  const hasData = chartData.some(day => day.average !== null)

  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trend</h3>
        <div className="text-center text-gray-500 py-8">
          No readings in the past 7 days. Add some readings to see your weekly trend.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              domain={[50, 250]}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={targetMin} stroke="#EF4444" strokeDasharray="5 5" label="Low" />
            <ReferenceLine y={targetMax} stroke="#EF4444" strokeDasharray="5 5" label="High" />
            <Line 
              type="monotone" 
              dataKey="average" 
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}