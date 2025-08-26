import { NextResponse } from "next/server"
import { getConnection } from "@/lib/mysql/client"
import type { RowDataPacket } from "mysql2"

interface SettingRow extends RowDataPacket {
  key: string
  value: string
}

export async function GET() {
  let connection
  try {
    try {
      connection = await getConnection()
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      return NextResponse.json({ 
        error: "Database connection failed. Please ensure MySQL server is running.",
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 503 })
    }

    const [rows] = await connection.execute(`
      SELECT 
        \`key\`,
        value
      FROM settings
    `)

    const settings: Record<string, string> = {}
    ;(rows as SettingRow[]).forEach((row) => {
      settings[row.key] = row.value
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  } finally {
    if (connection) connection.release()
  }
}
