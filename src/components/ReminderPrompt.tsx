'use client'

import { useState } from 'react'
import { Bell, X, Clock } from 'lucide-react'

interface ReminderPromptProps {
  isOpen: boolean
  onClose: () => void
  onSetReminder: (minutes: number) => void
  defaultMinutes?: number
}

export function ReminderPrompt({ isOpen, onClose, onSetReminder, defaultMinutes = 120 }: ReminderPromptProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes)
  const [isCustom, setIsCustom] = useState(false)

  if (!isOpen) return null

  const handleSetReminder = () => {
    onSetReminder(selectedMinutes)
    onClose()
  }

  const presetOptions = [
    { value: 30, label: '30 min' },
    { value: 90, label: '90 min' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600" />
            Set Reminder
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Would you like to be reminded to check your blood sugar again?
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {presetOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedMinutes(option.value)
                  setIsCustom(false)
                }}
                className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                  selectedMinutes === option.value && !isCustom
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div>
            <button
              onClick={() => setIsCustom(true)}
              className={`w-full p-3 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-2 ${
                isCustom
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              Custom Time
            </button>
            
            {isCustom && (
              <div className="mt-2">
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={selectedMinutes}
                  onChange={(e) => setSelectedMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Minutes (15-480)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Between 15 minutes and 8 hours
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleSetReminder}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  )
}