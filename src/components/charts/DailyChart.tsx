'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import { Database } from '@/types/database'

type Reading = Database['public']['Tables']['readings']['Row']

interface DailyChartProps {
  readings: Reading[]
  targetMin?: number
  targetMax?: number
}

export function DailyChart({ readings, targetMin = 70, targetMax = 140 }: DailyChartProps) {
  const chartData = readings
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((reading) => ({
      time: format(new Date(reading.recorded_at), 'HH:mm'),
      value: reading.value,
      type: reading.reading_type,
      fullTime: reading.recorded_at,
      id: reading.id
    }))

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{
      payload: {
        value: number
        type: string
      }
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${data.value} mg/dL`}</p>
          <p className="text-sm text-gray-600">{`Time: ${label}`}</p>
          <p className="text-sm text-gray-600 capitalize">{`Type: ${data.type.replace('_', ' ')}`}</p>
        </div>
      )
    }
    return null
  }

  if (readings.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trend</h3>
        <div className="text-center text-gray-500 py-8">
          No readings for today. Add some readings to see your daily trend.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis 
              domain={[50, 250]}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={targetMin} stroke="#EF4444" strokeDasharray="5 5" label="Low" />
            <ReferenceLine y={targetMax} stroke="#EF4444" strokeDasharray="5 5" label="High" />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}