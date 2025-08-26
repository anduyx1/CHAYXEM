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
      console.warn("Database unavailable, using fallback settings")
      // Return default settings when database is unavailable
      const defaultSettings = {
        businessName: "Demo Store",
        currency: "USD",
        taxRate: "10",
        enableTax: "true"
      }
      return NextResponse.json(defaultSettings)
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
