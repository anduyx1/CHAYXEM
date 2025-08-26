import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Database, Wifi, WifiOff } from 'lucide-react'

interface DatabaseStatus {
  isConnected: boolean
  error?: string
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({ isConnected: true })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch('/api/health')
        if (response.status === 503) {
          const errorData = await response.json()
          setStatus({ 
            isConnected: false, 
            error: errorData.error || 'Database connection failed' 
          })
          setIsVisible(true)
        } else {
          setStatus({ isConnected: true })
          setIsVisible(false)
        }
      } catch (error) {
        setStatus({ 
          isConnected: false, 
          error: 'Unable to check database status' 
        })
        setIsVisible(true)
      }
    }

    // Check immediately
    checkDatabaseStatus()
    
    // Check every 30 seconds
    const interval = setInterval(checkDatabaseStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (!isVisible || status.isConnected) {
    return null
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span>Database unavailable - running in offline mode with cached data</span>
          <WifiOff className="h-4 w-4" />
        </div>
      </AlertDescription>
    </Alert>
  )
}