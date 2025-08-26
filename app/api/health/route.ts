import { NextResponse } from "next/server"
import { getDbConnection } from "@/lib/mysql/client"

export async function GET() {
  try {
    const connection = await getDbConnection()
    
    // Test the connection with a simple query
    await connection.execute('SELECT 1')
    connection.release()
    
    return NextResponse.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}