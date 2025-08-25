"use server"

import { unstable_noStore as noStore } from "next/cache"
import { getDbConnection } from "@/lib/mysql/client"
import type { StockMovement, StockMovementType } from "@/lib/types/database"
import type { MutationResult } from "@/lib/services/products"
import type { RowDataPacket } from "mysql2"

interface StockMovementRow extends RowDataPacket {
  id: number
  product_id: number
  product_name: string
  product_barcode: string | null
  product_sku: string | null
  quantity_change: number
  type: StockMovementType
  reason: string | null
  created_at: Date
}

export async function createStockMovement(
  movement: Omit<StockMovement, "id" | "created_at">,
): Promise<MutationResult<StockMovement | null>> {
  const pool = await getDbConnection()
  if (!pool) {
    return { success: false, error: "Database connection not available." }
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO stock_movements (product_id, quantity_change, type, reason)
       VALUES (?, ?, ?, ?)`,
      [movement.product_id, movement.quantity_change, movement.type, movement.reason || null],
    )
    // @ts-expect-error - MySQL result.insertId is not typed but exists at runtime
    const newId = result.insertId
    const [rows] = await pool.execute(`SELECT * FROM stock_movements WHERE id = ?`, [newId])
    const newMovement = (rows as StockMovementRow[])[0]
    return { success: true, data: newMovement as StockMovement }
  } catch (error: unknown) {
    console.error("Error creating stock movement:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create stock movement."
    return { success: false, error: errorMessage }
  }
}

export async function getStockMovements(
  productId?: number,
  type?: StockMovementType, // Thêm tham số type
  startDate?: string,
  endDate?: string,
): Promise<StockMovement[]> {
  noStore()
  const pool = await getDbConnection()
  if (!pool) {
    console.warn("MySQL connection pool not available, returning empty stock movements.")
    return []
  }

  let query = `
    SELECT sm.*, p.name as product_name, p.barcode as product_barcode, p.sku as product_sku
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    WHERE 1=1
  `
  const params: (number | string)[] = []

  if (productId) {
    query += ` AND sm.product_id = ?`
    params.push(productId)
  }
  if (type && type !== "all") {
    query += ` AND sm.type = ?`
    params.push(type)
  }
  if (startDate) {
    query += ` AND sm.created_at >= ?`
    params.push(startDate)
  }
  if (endDate) {
    query += ` AND sm.created_at <= ?`
    params.push(endDate)
  }

  query += ` ORDER BY sm.created_at DESC`

  try {
    const [rows] = await pool.execute(query, params)
    return (rows as StockMovementRow[]).map((row) => ({
      id: row.id,
      product_id: row.product_id,
      product_name: row.product_name,
      product_barcode: row.product_barcode,
      product_sku: row.product_sku,
      quantity_change: row.quantity_change,
      type: row.type,
      reason: row.reason,
      created_at: new Date(row.created_at).toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return []
  }
}
