import { NextResponse } from "next/server"
import { getConnection } from "@/lib/mysql/client"

export async function GET() {
  let connection
  try {
    connection = await getConnection()

    const [rows] = await connection.execute(`
      SELECT 
        id,
        name,
        phone,
        email,
        address,
        created_at,
        updated_at
      FROM customers 
      ORDER BY name ASC
    `)

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  } finally {
    if (connection) connection.release()
  }
}
