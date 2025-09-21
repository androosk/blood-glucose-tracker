export class PushSubscriptionManager {
  private registration: ServiceWorkerRegistration | null = null

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      return true
    } catch (error) {
      console.error('Service worker not ready:', error)
      return false
    }
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize()
    }

    if (!this.registration) {
      return null
    }

    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) {
        throw new Error('VAPID public key not configured')
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      })

      // Register with our backend
      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      })

      if (!response.ok) {
        throw new Error('Failed to register subscription')
      }

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (!subscription) {
        return true
      }

      // Unregister from our backend
      await fetch('/api/notifications/register', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })

      // Unsubscribe from browser
      await subscription.unsubscribe()
      return true
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      return false
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize()
    }

    if (!this.registration) {
      return null
    }

    try {
      return await this.registration.pushManager.getSubscription()
    } catch (error) {
      console.error('Failed to get subscription:', error)
      return null
    }
  }

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray.buffer
  }
}

export const pushSubscriptionManager = new PushSubscriptionManager()