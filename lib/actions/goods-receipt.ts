"use server"

import { getConnection } from "@/lib/mysql/client"
import { revalidatePath } from "next/cache"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export interface GoodsReceiptData {
  supplier: string
  branch: string
  staff: string
  deliveryDate?: string
  note?: string
  tags?: string
  items: {
    productId: number
    quantity: number
    unitPrice: number
    discount: number
  }[]
}

interface SupplierRow extends RowDataPacket {
  id: number
  name: string
  phone?: string
  address?: string
  email?: string
}

interface GoodsReceiptRow extends RowDataPacket {
  id: number
  receipt_code: string
  supplier: string
  branch: string
  staff: string
  delivery_date?: string
  note?: string
  tags?: string
  total_amount: number
  paid_amount: number
  status: string
  created_at: Date
  updated_at: Date
}

export async function payGoodsReceipt(receiptId: number, paymentAmount: number) {
  const connection = await getConnection()

  try {
    await connection.beginTransaction()

    await connection.execute(
      `UPDATE goods_receipts 
       SET paid_amount = paid_amount + ?, 
           status = CASE 
             WHEN (paid_amount + ?) >= total_amount THEN 'completed' 
             ELSE 'pending' 
           END,
           updated_at = NOW()
       WHERE id = ?`,
      [paymentAmount, paymentAmount, receiptId],
    )

    await connection.commit()
    revalidatePath("/inventory/goods-receipt")

    return {
      success: true,
      message: "Thanh toán thành công",
    }
  } catch (error) {
    await connection.rollback()
    console.error("Error processing payment:", error)
    return {
      success: false,
      error: "Không thể xử lý thanh toán",
    }
  } finally {
    connection.release()
  }
}

export async function createOrUpdateSupplier(supplierData: {
  name: string
  phone?: string
  address?: string
  email?: string
}) {
  const connection = await getConnection()

  try {
    const [existingSuppliers] = (await connection.execute(
      `SELECT * FROM customers 
       WHERE name = ? OR (phone IS NOT NULL AND phone = ?)
       LIMIT 1`,
      [supplierData.name, supplierData.phone || null],
    )) as SupplierRow[]

    if (existingSuppliers.length > 0) {
      const existingSupplier = existingSuppliers[0]
      await connection.execute(
        `UPDATE customers 
         SET phone = COALESCE(?, phone),
             address = COALESCE(?, address),
             email = COALESCE(?, email),
             updated_at = NOW()
         WHERE id = ?`,
        [supplierData.phone || null, supplierData.address || null, supplierData.email || null, existingSupplier.id],
      )

      return {
        success: true,
        data: {
          id: existingSupplier.id,
          name: existingSupplier.name,
          phone: supplierData.phone || existingSupplier.phone,
          address: supplierData.address || existingSupplier.address,
          email: supplierData.email || existingSupplier.email,
        },
        message: "Đã cập nhật thông tin nhà cung cấp",
      }
    } else {
      const [result] = (await connection.execute(
        `INSERT INTO customers (name, phone, address, email, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [supplierData.name, supplierData.phone || null, supplierData.address || null, supplierData.email || null],
      )) as ResultSetHeader[]

      return {
        success: true,
        data: {
          id: result.insertId,
          name: supplierData.name,
          phone: supplierData.phone,
          address: supplierData.address,
          email: supplierData.email,
        },
        message: "Đã tạo nhà cung cấp mới",
      }
    }
  } catch (error) {
    console.error("Error creating/updating supplier:", error)
    return {
      success: false,
      error: "Không thể tạo hoặc cập nhật nhà cung cấp",
    }
  } finally {
    connection.release()
  }
}

export async function createGoodsReceipt(data: GoodsReceiptData) {
  const connection = await getConnection()

  try {
    await connection.beginTransaction()

    const receiptCode = `PON${Date.now().toString().slice(-6)}`

    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0)

    const [receiptResult] = (await connection.execute(
      `INSERT INTO goods_receipts 
       (receipt_code, supplier, branch, staff, delivery_date, note, tags, total_quantity, total_amount, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
      [
        receiptCode,
        data.supplier || "Nhà cung cấp mặc định",
        data.branch,
        data.staff,
        data.deliveryDate || null,
        data.note || "",
        data.tags || "",
        totalQuantity,
        totalAmount,
      ],
    )) as ResultSetHeader[]

    const receiptId = receiptResult.insertId

    for (const item of data.items) {
      await connection.execute(
        `INSERT INTO goods_receipt_items 
         (receipt_id, product_id, quantity, unit_price, discount, total_amount) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          receiptId,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.discount,
          item.quantity * item.unitPrice - item.discount,
        ],
      )

      await connection.execute(
        `UPDATE products 
         SET stock_quantity = stock_quantity + ?, updated_at = NOW() 
         WHERE id = ?`,
        [item.quantity, item.productId],
      )

      await connection.execute(
        `INSERT INTO stock_movements 
         (product_id, movement_type, quantity_change, reason, created_at) 
         VALUES (?, 'in', ?, ?, NOW())`,
        [item.productId, item.quantity, `Nhập hàng ${receiptCode}`],
      )
    }

    await connection.commit()

    revalidatePath("/inventory/goods-receipt")

    return {
      success: true,
      receiptId,
      receiptCode,
      message: "Đã tạo đơn nhập hàng thành công",
    }
  } catch (error) {
    await connection.rollback()
    console.error("Error creating goods receipt:", error)
    return {
      success: false,
      error: "Không thể tạo đơn nhập hàng",
    }
  } finally {
    connection.release()
  }
}

export async function getGoodsReceipts() {
  const connection = await getConnection()

  try {
    const [rows] = await connection.execute(
      `SELECT gr.*, 
       s.name as supplier_name,
       s.phone as supplier_phone,
       COUNT(gri.id) as item_count,
       COALESCE(SUM(returns.total_amount), 0) as returned_amount,
       CASE 
         WHEN COALESCE(SUM(returns.total_amount), 0) >= gr.total_amount THEN 'returned'
         WHEN COALESCE(SUM(returns.total_amount), 0) > 0 THEN 'partial_returned'
         WHEN gr.paid_amount >= gr.total_amount THEN 'paid'
         WHEN gr.paid_amount > 0 THEN 'partial'
         ELSE 'unpaid'
       END as payment_status,
       CASE 
         WHEN COALESCE(SUM(returns.total_amount), 0) >= gr.total_amount THEN 'returned'
         WHEN COALESCE(SUM(returns.total_amount), 0) > 0 THEN 'partial_returned'
         ELSE NULL
       END as display_status
       FROM goods_receipts gr
       LEFT JOIN suppliers s ON gr.supplier_id = s.id
       LEFT JOIN goods_receipt_items gri ON gr.id = gri.receipt_id
       LEFT JOIN goods_returns returns ON gr.id = returns.goods_receipt_id
       GROUP BY gr.id
       ORDER BY gr.created_at DESC`,
    )

    return { success: true, data: rows }
  } catch (error) {
    console.error("Error fetching goods receipts:", error)
    return { success: false, error: "Không thể lấy danh sách đơn nhập hàng" }
  } finally {
    connection.release()
  }
}

export async function getGoodsReceiptDetail(id: number) {
  const connection = await getConnection()

  try {
    console.log("🔍 Getting goods receipt detail for ID:", id)

    const [receiptRows] = (await connection.execute(`SELECT * FROM goods_receipts WHERE id = ?`, [
      id,
    ])) as GoodsReceiptRow[]

    if (receiptRows.length === 0) {
      return { success: false, error: "Không tìm thấy đơn nhập hàng" }
    }

    const receipt = receiptRows[0]
    console.log("📋 Receipt found:", receipt.receipt_code, "Supplier:", receipt.supplier)

    const [itemRows] = await connection.execute(
      `SELECT gri.*, p.name as product_name, p.sku, p.barcode, p.image_url,
       COALESCE(
         (SELECT SUM(gri_ret.quantity) 
          FROM goods_return_items gri_ret 
          JOIN goods_returns gr ON gri_ret.return_id = gr.id 
          WHERE gr.goods_receipt_id = ? AND gri_ret.product_id = gri.product_id), 
         0
       ) as returned_quantity
       FROM goods_receipt_items gri
       JOIN products p ON gri.product_id = p.id
       WHERE gri.receipt_id = ?
       ORDER BY gri.id`,
      [id, id],
    )

    console.log("📊 Calculating supplier stats for:", receipt.supplier)

    const [supplierStats] = (await connection.execute(
      `SELECT 
        COUNT(*) as order_count,
        SUM(total_amount) as total_orders,
        SUM(CASE WHEN status != 'completed' THEN total_amount ELSE 0 END) as unpaid_amount
       FROM goods_receipts 
       WHERE supplier = ?`,
      [receipt.supplier],
    )) as RowDataPacket[]

    const [returnStats] = (await connection.execute(
      `SELECT COALESCE(SUM(gr.total_amount), 0) as total_returns
       FROM goods_returns gr
       JOIN goods_receipts grs ON gr.goods_receipt_id = grs.id
       WHERE grs.supplier = ?`,
      [receipt.supplier],
    )) as RowDataPacket[]

    const supplierData = supplierStats[0] || {}
    const returnData = returnStats[0] || {}

    console.log("📈 Supplier stats:", {
      orderCount: supplierData.order_count,
      totalOrders: supplierData.total_orders,
      unpaidAmount: supplierData.unpaid_amount,
      totalReturns: returnData.total_returns,
    })

    const [supplierContact] = (await connection.execute(`SELECT phone, address FROM customers WHERE name = ? LIMIT 1`, [
      receipt.supplier,
    ])) as RowDataPacket[]

    const contactInfo = supplierContact[0] || {}

    const items = (itemRows as RowDataPacket[]).map((item) => {
      const quantity = Number(item.quantity) || 0
      const returnedQuantity = Number(item.returned_quantity) || 0
      const canReturnItem = quantity > returnedQuantity

      console.log(
        `📦 Item ${item.product_name}: quantity=${quantity}, returned=${returnedQuantity}, canReturn=${canReturnItem}`,
      )

      return {
        id: Number(item.id),
        productName: item.product_name,
        sku: item.sku,
        imageUrl: item.image_url,
        unit: "---",
        quantity,
        unitPrice: Number(item.unit_price) || 0,
        discount: Number(item.discount) || 0,
        totalPrice: Number(item.total_amount) || 0,
        returnedQuantity,
        canReturn: canReturnItem,
      }
    })

    const canReturn = items.some((item) => item.canReturn)
    console.log(
      "🔄 Can return overall:",
      canReturn,
      "Items with return possibility:",
      items.filter((item) => item.canReturn).length,
    )

    const formattedData = {
      id: Number(receipt.id),
      receiptCode: receipt.receipt_code,
      status: receipt.status,
      supplierName: receipt.supplier,
      supplierPhone: contactInfo.phone || "0352210000",
      supplierAddress: contactInfo.address || "Địa chỉ nhà cung cấp",
      branch: receipt.branch || "Chi nhánh mặc định",
      staff: receipt.staff,
      createdAt: new Date(receipt.created_at).toLocaleString("vi-VN"),
      deliveryDate: receipt.delivery_date ? new Date(receipt.delivery_date).toLocaleString("vi-VN") : null,
      note: receipt.note || "",
      tags: receipt.tags || "",
      totalAmount: Number(receipt.total_amount) || 0,
      paidAmount: Number(receipt.paid_amount) || 0,
      supplierDebt: Number(supplierData.unpaid_amount) || 0,
      supplierTotalOrders: Number(supplierData.total_orders) || 0,
      supplierOrderCount: Number(supplierData.order_count) || 0,
      supplierReturns: Number(returnData.total_returns) || 0,
      canReturn,
      items,
    }

    console.log("✅ Final canReturn status:", formattedData.canReturn)

    return {
      success: true,
      data: formattedData,
    }
  } catch (error) {
    console.error("❌ Error fetching goods receipt detail:", error)
    return { success: false, error: "Không thể lấy chi tiết đơn nhập hàng" }
  } finally {
    connection.release()
  }
}

export async function completeGoodsReceipt(receiptId: number) {
  const connection = await getConnection()

  try {
    const [receiptRows] = (await connection.execute(
      `SELECT total_amount, paid_amount, status FROM goods_receipts WHERE id = ?`,
      [receiptId],
    )) as RowDataPacket[]

    if (receiptRows.length === 0) {
      return {
        success: false,
        error: "Không tìm thấy đơn nhập hàng",
      }
    }

    const receipt = receiptRows[0]
    const totalAmount = Number(receipt.total_amount) || 0
    const paidAmount = Number(receipt.paid_amount) || 0

    if (paidAmount < totalAmount) {
      return {
        success: false,
        error: "Đơn hàng chưa được thanh toán đầy đủ. Vui lòng thanh toán trước khi hoàn thành.",
      }
    }

    if (receipt.status === "completed") {
      return {
        success: false,
        error: "Đơn nhập hàng đã được hoàn thành",
      }
    }

    await connection.execute(
      `UPDATE goods_receipts 
       SET status = 'completed', updated_at = NOW()
       WHERE id = ?`,
      [receiptId],
    )

    revalidatePath("/inventory/goods-receipt")

    return {
      success: true,
      message: "Đơn nhập hàng đã được hoàn thành thành công",
    }
  } catch (error) {
    console.error("Error completing goods receipt:", error)
    return {
      success: false,
      error: "Không thể hoàn thành đơn nhập hàng",
    }
  } finally {
    connection.release()
  }
}
