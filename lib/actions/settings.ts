"use server"

import { dbPool } from "@/lib/mysql/client"
import type { InvoiceSettings, Settings } from "@/lib/types/database"
import type { ResultSetHeader, RowDataPacket } from "mysql2"
import { revalidatePath } from "next/cache"

interface TaxRateRow extends RowDataPacket {
  tax_rate: string
}

interface InvoiceSettingsRow extends RowDataPacket {
  id: number
  business_name: string | null
  business_address: string | null
  business_phone: string | null
  business_email: string | null
  business_website: string | null
  business_tax_id: string | null
  logo_url: string | null
  default_template: string | null
  show_notes: number
  show_customer_info: number
  show_tax: number
  show_discount: number
  header_font_size: number | null
  text_color: string | null
  created_at: string
  updated_at: string
}

interface AppSettingsRow extends RowDataPacket {
  id: string
  tax_rate: string
  shop_name: string | null
  shop_address: string | null
  shop_phone: string | null
  default_receipt_template_id: number | null
  default_pre_receipt_template_id: number | null
  last_order_sequence: number
  created_at: string
  updated_at: string
}

export async function getTaxRate(): Promise<number> {
  const connection = await dbPool.getConnection()
  try {
    const [rows] = await connection.query<TaxRateRow[]>(
      "SELECT tax_rate FROM pos_app_settings WHERE id = 'pos_settings'",
    )
    return rows.length > 0 ? Number.parseFloat(rows[0].tax_rate) : 0.1
  } catch (error) {
    console.error("Error fetching tax rate:", error)
    return 0.1
  } finally {
    connection.release()
  }
}

export async function updateTaxRate(newTaxRate: number): Promise<{ success: boolean; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    await connection.query("UPDATE pos_app_settings SET tax_rate = ? WHERE id = 'pos_settings'", [newTaxRate])
    revalidatePath("/settings/tax")
    return { success: true }
  } catch (error: unknown) {
    console.error("Error updating tax rate:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}

export async function getInvoiceSettings(): Promise<InvoiceSettings | null> {
  const connection = await dbPool.getConnection()
  try {
    const [rows] = await connection.execute<InvoiceSettingsRow[]>(`SELECT * FROM invoice_settings LIMIT 1`)
    if (rows.length > 0) {
      const settings = rows[0]
      return {
        id: settings.id,
        businessName: settings.business_name || null,
        businessAddress: settings.business_address || null,
        businessPhone: settings.business_phone || null,
        businessEmail: settings.business_email || null,
        businessWebsite: settings.business_website || null,
        businessTaxId: settings.business_tax_id || null,
        logoUrl: settings.logo_url || null,
        defaultTemplate: settings.default_template || null,
        showNotes: Boolean(settings.show_notes),
        showCustomerInfo: Boolean(settings.show_customer_info),
        showTax: Boolean(settings.show_tax),
        showDiscount: Boolean(settings.show_discount),
        headerFontSize: settings.header_font_size || null,
        textColor: settings.text_color || null,
        createdAt: settings.created_at,
        updatedAt: settings.updated_at,
      } as InvoiceSettings
    }
    return null
  } catch (error: unknown) {
    console.error("Lỗi khi lấy cài đặt hóa đơn:", error)
    return null
  } finally {
    connection.release()
  }
}

export async function updateInvoiceSettings(
  settings: Partial<InvoiceSettings>,
): Promise<{ success: boolean; message?: string; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    const existingSettings = await getInvoiceSettings()

    if (existingSettings) {
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE invoice_settings SET
        business_name = ?,
        business_address = ?,
        business_phone = ?,
        business_email = ?,
        business_website = ?,
        business_tax_id = ?,
        logo_url = ?,
        default_template = ?,
        show_notes = ?,
        show_customer_info = ?,
        show_tax = ?,
        show_discount = ?,
        header_font_size = ?,
        text_color = ?,
        updated_at = NOW()
        WHERE id = ?`,
        [
          settings.businessName ?? existingSettings.businessName,
          settings.businessAddress ?? existingSettings.businessAddress,
          settings.businessPhone ?? existingSettings.businessPhone,
          settings.businessEmail ?? existingSettings.businessEmail,
          settings.businessWebsite ?? existingSettings.businessWebsite,
          settings.businessTaxId ?? existingSettings.businessTaxId,
          settings.logoUrl ?? existingSettings.logoUrl,
          settings.defaultTemplate ?? existingSettings.defaultTemplate,
          settings.showNotes !== undefined ? (settings.showNotes ? 1 : 0) : existingSettings.showNotes ? 1 : 0,
          settings.showCustomerInfo !== undefined
            ? settings.showCustomerInfo
              ? 1
              : 0
            : existingSettings.showCustomerInfo
              ? 1
              : 0,
          settings.showTax !== undefined ? (settings.showTax ? 1 : 0) : existingSettings.showTax ? 1 : 0,
          settings.showDiscount !== undefined ? (settings.showDiscount ? 1 : 0) : existingSettings.showDiscount ? 1 : 0,
          settings.headerFontSize ?? existingSettings.headerFontSize,
          settings.textColor ?? existingSettings.textColor,
          existingSettings.id,
        ],
      )
      return { success: result.affectedRows > 0, message: "Cài đặt hóa đơn đã được cập nhật." }
    } else {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO invoice_settings (business_name, business_address, business_phone, business_email, business_website, business_tax_id, logo_url, default_template, show_notes, show_customer_info, show_tax, show_discount, header_font_size, text_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settings.businessName || null,
          settings.businessAddress || null,
          settings.businessPhone || null,
          settings.businessEmail || null,
          settings.businessWebsite || null,
          settings.businessTaxId || null,
          settings.logoUrl || null,
          settings.defaultTemplate || null,
          settings.showNotes ? 1 : 0,
          settings.showCustomerInfo ? 1 : 0,
          settings.showTax ? 1 : 0,
          settings.showDiscount ? 1 : 0,
          settings.headerFontSize || null,
          settings.textColor || null,
        ],
      )
      return { success: result.affectedRows > 0, message: "Cài đặt hóa đơn đã được tạo." }
    }
  } catch (error: unknown) {
    console.error("Lỗi khi cập nhật cài đặt hóa đơn:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật cài đặt hóa đơn."
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}

export async function getAppSettings(): Promise<Settings | null> {
  const connection = await dbPool.getConnection()
  try {
    const [rows] = await connection.execute<AppSettingsRow[]>(
      `SELECT * FROM pos_app_settings WHERE id = 'pos_settings'`,
    )
    if (rows.length > 0) {
      const settings = rows[0]
      return {
        id: settings.id,
        tax_rate: settings.tax_rate,
        shop_name: settings.shop_name || null,
        shop_address: settings.shop_address || null,
        shop_phone: settings.shop_phone || null,
        default_receipt_template_id: settings.default_receipt_template_id || null,
        default_pre_receipt_template_id: settings.default_pre_receipt_template_id || null,
        last_order_sequence: settings.last_order_sequence,
        created_at: settings.created_at,
        updated_at: settings.updated_at,
      } as Settings
    }
    return null
  } catch (error: unknown) {
    console.error("Lỗi khi lấy cài đặt ứng dụng:", error)
    return null
  } finally {
    connection.release()
  }
}

export async function updateAppSettings(
  settings: Partial<Settings>,
): Promise<{ success: boolean; message?: string; error?: string }> {
  const connection = await dbPool.getConnection()
  try {
    const existingSettings = await getAppSettings()

    if (existingSettings) {
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE pos_app_settings SET
        tax_rate = ?,
        shop_name = ?,
        shop_address = ?,
        shop_phone = ?,
        default_receipt_template_id = ?,
        default_pre_receipt_template_id = ?,
        last_order_sequence = ?,
        updated_at = NOW()
        WHERE id = 'pos_settings'`,
        [
          settings.tax_rate ?? existingSettings.tax_rate,
          settings.shop_name ?? existingSettings.shop_name,
          settings.shop_address ?? existingSettings.shop_address,
          settings.shop_phone ?? existingSettings.shop_phone,
          settings.default_receipt_template_id ?? existingSettings.default_receipt_template_id,
          settings.default_pre_receipt_template_id ?? existingSettings.default_pre_receipt_template_id,
          settings.last_order_sequence ?? existingSettings.last_order_sequence,
        ],
      )
      return { success: result.affectedRows > 0, message: "Cài đặt ứng dụng đã được cập nhật." }
    } else {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO pos_app_settings (id, tax_rate, shop_name, shop_address, shop_phone, default_receipt_template_id, default_pre_receipt_template_id, last_order_sequence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "pos_settings",
          settings.tax_rate ?? "0.1",
          settings.shop_name ?? "Cửa hàng của bạn",
          settings.shop_address ?? "Địa chỉ cửa hàng của bạn",
          settings.shop_phone ?? "0123456789",
          settings.default_receipt_template_id ?? null,
          settings.default_pre_receipt_template_id ?? null,
          settings.last_order_sequence ?? 0,
        ],
      )
      return { success: result.affectedRows > 0, message: "Cài đặt ứng dụng đã được tạo." }
    }
  } catch (error: unknown) {
    console.error("Lỗi khi cập nhật cài đặt ứng dụng:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật cài đặt ứng dụng."
    return { success: false, error: errorMessage }
  } finally {
    connection.release()
  }
}

export const getStoreSettings: typeof getAppSettings = getAppSettings
export const updateStoreSettings: typeof updateAppSettings = updateAppSettings
