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
        retail_price,
        wholesale_price,
        cost_price,
        stock_quantity,
        barcode,
        sku,
        status,
        created_at,
        updated_at
      FROM products 
      WHERE status = 'active'
      ORDER BY name ASC
    `)

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  } finally {
    if (connection) connection.release()
  }
}
