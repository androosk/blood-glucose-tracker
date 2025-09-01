'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Database } from '@/types/database'

type Reading = Database['public']['Tables']['readings']['Row']

interface MealCorrelationProps {
  readings: Reading[]
  targetMin?: number
  targetMax?: number
}

export function MealCorrelation({ readings, targetMin = 70, targetMax = 140 }: MealCorrelationProps) {
  const mealReadings = readings.filter(reading => 
    reading.carbs !== null && reading.carbs > 0
  )

  const chartData = mealReadings.map(reading => ({
    carbs: reading.carbs,
    glucose: reading.value,
    type: reading.reading_type,
    id: reading.id,
    recorded_at: reading.recorded_at
  }))

  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: Array<{
      payload: {
        carbs: number
        glucose: number
        type: string
        recorded_at: string
      }
    }>
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">{`${data.glucose} mg/dL`}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{`Carbs: ${data.carbs}g`}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">{`Type: ${data.type.replace('_', ' ')}`}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(data.recorded_at).toLocaleDateString()}
          </p>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Carbs vs Blood Sugar</h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No readings with carb data. Add carb information to your readings to see correlations.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Carbs vs Blood Sugar</h3>
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="carbs" 
              name="Carbs (g)"
              tickFormatter={(value) => `${value}g`}
            />
            <YAxis 
              type="number" 
              dataKey="glucose" 
              name="Blood Sugar"
              domain={[50, 250]}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={targetMin} stroke="#EF4444" strokeDasharray="5 5" />
            <ReferenceLine y={targetMax} stroke="#EF4444" strokeDasharray="5 5" />
            <Scatter dataKey="glucose" fill="#3B82F6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Shows the relationship between carbohydrate intake and blood sugar levels.
      </div>
    </div>
  )
}