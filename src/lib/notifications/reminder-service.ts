import { createClient } from '@/lib/supabase/client'

export interface ReminderSchedule {
  readingId: string
  mealId?: string
  userId: string
  reminderType: '30min' | '90min'
  scheduledTime: Date
  readingType: 'post_30' | 'post_90'
}

export class ReminderService {
  private supabase = createClient()

  /**
   * Schedule reminders after a pre-meal reading is logged
   */
  async schedulePostMealReminders(
    readingId: string, 
    userId: string,
    mealStartTime: Date = new Date()
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if notifications are enabled
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return { success: false, error: 'Notifications not enabled' }
      }

      // Get user preferences for reminder timing
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('reminder_1_minutes, reminder_2_minutes, silent_start, silent_end, timezone')
        .eq('id', userId)
        .single()

      const reminder1Minutes = profile?.reminder_1_minutes || 30
      const reminder2Minutes = profile?.reminder_2_minutes || 90

      // Calculate reminder times
      const reminder30 = new Date(mealStartTime.getTime() + reminder1Minutes * 60000)
      const reminder90 = new Date(mealStartTime.getTime() + reminder2Minutes * 60000)

      // Check if reminders fall within silent hours
      const adjustedReminder30 = this.adjustForSilentHours(
        reminder30, 
        profile?.silent_start, 
        profile?.silent_end
      )
      const adjustedReminder90 = this.adjustForSilentHours(
        reminder90, 
        profile?.silent_start, 
        profile?.silent_end
      )

      // Schedule the notifications using Web Push API (for now, using local scheduling)
      await this.scheduleLocalNotification({
        readingId,
        userId,
        reminderType: '30min',
        scheduledTime: adjustedReminder30,
        readingType: 'post_30'
      })

      await this.scheduleLocalNotification({
        readingId,
        userId,
        reminderType: '90min', 
        scheduledTime: adjustedReminder90,
        readingType: 'post_90'
      })

      return { success: true }
    } catch (error) {
      console.error('Error scheduling reminders:', error)
      return { success: false, error: 'Failed to schedule reminders' }
    }
  }

  /**
   * Schedule a local notification (browser-based)
   */
  private async scheduleLocalNotification(schedule: ReminderSchedule): Promise<void> {
    const timeUntilReminder = schedule.scheduledTime.getTime() - Date.now()
    
    if (timeUntilReminder <= 0) {
      // Time has already passed, don't schedule
      return
    }

    // Store reminder in localStorage for persistence across sessions
    const reminders = this.getStoredReminders()
    const reminderId = `${schedule.readingId}_${schedule.reminderType}`
    
    reminders[reminderId] = {
      ...schedule,
      scheduledTime: schedule.scheduledTime.toISOString()
    }
    
    localStorage.setItem('bloodSugarReminders', JSON.stringify(reminders))

    // Set timeout for the notification
    setTimeout(() => {
      this.showReminderNotification(schedule)
    }, timeUntilReminder)
  }

  /**
   * Show the actual reminder notification
   */
  private async showReminderNotification(schedule: ReminderSchedule): Promise<void> {
    const timeLabel = schedule.reminderType === '30min' ? '30 minutes' : '90 minutes'
    
    const notification = new Notification('Blood Sugar Check Time! 📊', {
      body: `It's been ${timeLabel} since your meal. Time to check your blood sugar.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `reminder-${schedule.readingId}-${schedule.reminderType}`,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: {
        readingId: schedule.readingId,
        mealId: schedule.mealId,
        readingType: schedule.readingType,
        type: 'meal-reminder'
      },
      actions: [
        {
          action: 'log',
          title: '📝 Log Reading'
        },
        {
          action: 'snooze',  
          title: '⏰ Snooze 10min'
        }
      ]
    })

    // Handle click events
    notification.onclick = () => {
      window.focus()
      window.open(
        `/dashboard/add?from=notification&type=${schedule.readingType}&meal=${schedule.mealId}`, 
        '_blank'
      )
      notification.close()
    }

    // Remove from stored reminders once shown
    this.removeStoredReminder(`${schedule.readingId}_${schedule.reminderType}`)
  }

  /**
   * Adjust reminder time to avoid silent hours
   */
  private adjustForSilentHours(
    originalTime: Date,
    silentStart?: string,
    silentEnd?: string
  ): Date {
    if (!silentStart || !silentEnd) {
      return originalTime
    }

    const timeStr = originalTime.toTimeString().slice(0, 5) // HH:MM format
    
    // Simple check - if reminder falls between silent hours, move to silent end time
    if (timeStr >= silentStart || timeStr <= silentEnd) {
      const adjusted = new Date(originalTime)
      const [endHour, endMinute] = silentEnd.split(':').map(Number)
      adjusted.setHours(endHour, endMinute, 0, 0)
      
      // If that's still in the past, move to next day
      if (adjusted.getTime() <= Date.now()) {
        adjusted.setDate(adjusted.getDate() + 1)
      }
      
      return adjusted
    }

    return originalTime
  }

  /**
   * Get stored reminders from localStorage
   */
  private getStoredReminders(): Record<string, ReminderSchedule & { scheduledTime: string }> {
    try {
      const stored = localStorage.getItem('bloodSugarReminders')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  /**
   * Remove a stored reminder
   */
  private removeStoredReminder(reminderId: string): void {
    const reminders = this.getStoredReminders()
    delete reminders[reminderId]
    localStorage.setItem('bloodSugarReminders', JSON.stringify(reminders))
  }

  /**
   * Initialize reminder service - restore pending reminders on app load
   */
  async initializeReminders(): Promise<void> {
    const reminders = this.getStoredReminders()
    const now = Date.now()

    for (const [reminderId, reminderData] of Object.entries(reminders)) {
      const scheduledTime = new Date(reminderData.scheduledTime as string)
      const timeUntilReminder = scheduledTime.getTime() - now

      if (timeUntilReminder > 0) {
        // Re-schedule this reminder
        setTimeout(() => {
          this.showReminderNotification(reminderData as ReminderSchedule)
        }, timeUntilReminder)
      } else {
        // Remove expired reminders
        this.removeStoredReminder(reminderId)
      }
    }
  }

  /**
   * Cancel reminders for a specific reading (if user deletes the reading)
   */
  async cancelReminders(readingId: string): Promise<void> {
    const reminders = this.getStoredReminders()
    
    for (const reminderId of Object.keys(reminders)) {
      if (reminderId.startsWith(readingId)) {
        this.removeStoredReminder(reminderId)
      }
    }
  }

  /**
   * Test notification (for settings page)
   */
  async testNotification(): Promise<{ success: boolean; error?: string }> {
    if (!('Notification' in window)) {
      return { success: false, error: 'Notifications not supported' }
    }

    if (Notification.permission !== 'granted') {
      return { success: false, error: 'Notification permission not granted' }
    }

    try {
      new Notification('Test Notification 🧪', {
        body: 'This is how your blood sugar reminders will look!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200]
      })
      
      return { success: true }
    } catch {
      return { success: false, error: 'Failed to show test notification' }
    }
  }
}

// Export singleton instance
export const reminderService = new ReminderService()