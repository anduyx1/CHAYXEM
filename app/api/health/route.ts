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
    console.warn("Database unavailable, running in fallback mode:", error)
    return NextResponse.json({ 
      status: 'healthy',
      database: 'fallback_storage',
      message: 'Running with in-memory fallback storage',
      timestamp: new Date().toISOString()
    })
  }
}