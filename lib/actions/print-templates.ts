"use server" // Đảm bảo dòng này ở đầu file

import { dbPool } from "@/lib/mysql/client"
import type { PrintTemplate } from "@/lib/types/database"
import type { RowDataPacket } from "mysql2"

interface PrintTemplateRow extends RowDataPacket {
  id: string
  name: string
  content: string
  type: "receipt" | "pre_receipt"
  is_default: boolean
  created_at: string
  updated_at: string
}

export async function getAllPrintTemplates(): Promise<PrintTemplate[]> {
  try {
    const mysql = dbPool
    const [rows] = await mysql.query<PrintTemplateRow[]>("SELECT * FROM print_templates ORDER BY created_at DESC")
    return rows as PrintTemplate[]
  } catch (error) {
    console.error("Error fetching print templates:", error)
    return []
  }
}

export async function getPrintTemplateByType(type: "receipt" | "pre_receipt"): Promise<PrintTemplate | null> {
  try {
    const mysql = dbPool
    const [rows] = await mysql.query<PrintTemplateRow[]>(
      "SELECT * FROM print_templates WHERE type = ? AND is_default = TRUE LIMIT 1",
      [type],
    )
    return (rows[0] as PrintTemplate) || null
  } catch (error) {
    console.error(`Error fetching default ${type} template:`, error)
    return null
  }
}

export async function createPrintTemplate(
  name: string,
  content: string,
  type: "receipt" | "pre_receipt",
  isDefault: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const mysql = dbPool
    if (isDefault) {
      await mysql.query("UPDATE print_templates SET is_default = FALSE WHERE type = ?", [type])
    }
    await mysql.query(
      "INSERT INTO print_templates (name, content, type, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [name, content, type, isDefault],
    )
    return { success: true }
  } catch (error: unknown) {
    console.error("Error creating print template:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  }
}

export async function updatePrintTemplate(
  id: string,
  name: string,
  content: string,
  type: "receipt" | "pre_receipt",
  isDefault: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const mysql = dbPool
    if (isDefault) {
      await mysql.query("UPDATE print_templates SET is_default = FALSE WHERE type = ?", [type])
    }
    await mysql.query(
      "UPDATE print_templates SET name = ?, content = ?, type = ?, is_default = ?, updated_at = NOW() WHERE id = ?",
      [name, content, type, isDefault, id],
    )
    return { success: true }
  } catch (error: unknown) {
    console.error("Error updating print template:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  }
}

export async function deletePrintTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const mysql = dbPool
    await mysql.query("DELETE FROM print_templates WHERE id = ?", [id])
    return { success: true }
  } catch (error: unknown) {
    console.error("Error deleting print template:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  }
}

export async function setDefaultPrintTemplate(
  id: string,
  type: "receipt" | "pre_receipt",
): Promise<{ success: boolean; error?: string }> {
  try {
    const mysql = dbPool
    await mysql.query("UPDATE print_templates SET is_default = FALSE WHERE type = ?", [type])
    await mysql.query("UPDATE print_templates SET is_default = TRUE WHERE id = ?", [id])
    return { success: true }
  } catch (error: unknown) {
    console.error("Error setting default print template:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  }
}
