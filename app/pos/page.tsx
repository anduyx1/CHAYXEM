"use client"

import type React from "react"
import type { OrderData } from "@/lib/types/order-data" // Declare OrderData type

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { getProductsClient } from "@/lib/services/products-client"
import { getCustomersClient } from "@/lib/services/customers-client"
import { createOrderClient } from "@/lib/services/orders-client"
import { getTaxRate } from "@/lib/actions/settings"
import { getPrintTemplateByType } from "@/lib/actions/print-templates"
import { getPosSessions, createPosSession, updatePosSession, deletePosSession } from "@/lib/actions/pos-sessions"
import { offlineSyncService, type SyncStatus } from "@/lib/services/offline-sync"
import { indexedDBService } from "@/lib/services/indexeddb"
import ReceiptModal from "@/app/components/receipt-modal"
import PreReceiptModal from "@/app/components/pre-receipt-modal"
import CustomerFormModal from "@/app/components/customer-form-modal"
import ShortcutHelpModal from "@/app/components/shortcut-help-modal"
import QuickServiceModal from "@/app/components/quick-service-modal"
import PriceEditModal from "@/components/price-edit-modal"
import type { Product, CartItem, Customer, Order, PosSession } from "@/lib/types/database"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"
import { useNetworkStatus } from "@/hooks/use-network-status"

// Import các thành phần con mới
import PosHeader from "./components/pos-header"
import PosCartDisplay from "./components/pos-cart-display"
import PosProductGrid from "./components/pos-product-grid"
import PosSummaryPanel from "./components/pos-summary-panel"

interface OrderTab extends PosSession {
  customer?: Customer | null
  synced?: boolean
}

interface SearchMessage {
  type: string | null
  text: string
}

export default function POSPage() {
  const [activeTab, setActiveTab] = useState("products")
  const { toast } = useToast()
  const router = useRouter()
  const { isOnline } = useNetworkStatus()

  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [globalTaxRate, setGlobalTaxRate] = useState(0.1)
  const [orderTabs, setOrderTabs] = useState<OrderTab[]>([])
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null)
  const [nextOrderNumber, setNextOrderNumber] = useState<number>(1)

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingOrders: 0,
    syncInProgress: false,
  })
  const [offlineMode, setOfflineMode] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1)
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [customerFormDefaultName, setCustomerFormDefaultName] = useState<string>("")

  const [isPriceEditModalOpen, setIsPriceEditModalOpen] = useState(false)
  const [isQuickServiceModalOpen, setIsQuickServiceModalOpen] = useState(false)
  const [isShortcutHelpModalOpen, setIsShortcutHelpModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CartItem | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [isPreReceiptModalOpen, setIsPreReceiptModalOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const [lastOrderData, setLastOrderData] = useState<{
    order_id?: string
    total?: number
    customer?: Customer | null
    items?: CartItem[]
  }>({})
  const [customerForReceipt, setCustomerForReceipt] = useState<Customer | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 22

  const [searchMessage, setSearchMessage] = useState<SearchMessage>({ type: null, text: "" })
  const [defaultReceiptTemplateContent, setDefaultReceiptTemplateContent] = useState<string>("")
  const [defaultPreReceiptTemplateContent, setDefaultPreReceiptTemplateContent] = useState<string>("")

  const debouncedCustomerSearchTerm = useDebounce(customerSearchTerm, 300)

  const activeOrder = useMemo(() => {
    if (activeOrderId === null || !Array.isArray(orderTabs) || orderTabs.length === 0) {
      return {
        id: 0,
        session_name: "Đơn tạm",
        cart_items: [],
        customer_id: null,
        discount_amount: 0,
        received_amount: 0,
        notes: "Đơn hàng tạm thời",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tax_rate: 0.1,
        user_id: null,
        customer: null,
      } as OrderTab
    }
    return orderTabs.find((order) => order.id === activeOrderId) || orderTabs[0]
  }, [orderTabs, activeOrderId])

  const updateActiveOrder = useCallback(
    async (updates: Partial<OrderTab>) => {
      if (!activeOrderId) return

      const prevOrderTabs = orderTabs
      setOrderTabs((prevTabs) =>
        prevTabs.map((order) => (order.id === activeOrderId ? { ...order, ...updates } : order)),
      )

      if (offlineMode) {
        return
      }

      try {
        const dbUpdates: Partial<PosSession> = { ...updates }
        if (updates.cart_items) {
          dbUpdates.cart_items = updates.cart_items
        }
        if (updates.customer === null) {
          dbUpdates.customer_id = null
        } else if (updates.customer && updates.customer.id !== undefined) {
          dbUpdates.customer_id = updates.customer.id
        }
        delete (dbUpdates as Record<string, unknown>).customer
        delete (dbUpdates as Record<string, unknown>).createdAt

        await updatePosSession(activeOrderId, dbUpdates)
      } catch (error) {
        console.error("Failed to update POS session in database:", error)
        toast({
          title: "Lỗi!",
          description: "Không thể lưu thay đổi đơn hàng. Vui lòng thử lại.",
          variant: "destructive",
        })
        setOrderTabs(prevOrderTabs)
      }
    },
    [activeOrderId, orderTabs, setOrderTabs, toast, offlineMode],
  )

  const addToCart = useCallback(
    (product: Product) => {
      const price = product.wholesale_price
      const costPrice = product.cost_price

      const existingItem = activeOrder.cart_items.find((item) => item.id === product.id)
      if (existingItem) {
        // If product is a service, no stock limit
        if (existingItem.is_service) {
          updateActiveOrder({
            cart_items: activeOrder.cart_items.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          })
        } else {
          // For non-service products, allow increasing quantity even if it goes negative
          // Removed stock_quantity check to allow going into negative stock
          updateActiveOrder({
            cart_items: activeOrder.cart_items.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          })
        }
      } else {
        // Initial add of a new item
        // Keep the warning for out-of-stock items when adding for the first time
        if (!product.is_service && product.stock_quantity <= 0) {
          toast({
            title: "Cảnh báo!",
            description: `Sản phẩm "${product.name}" đã hết hàng. Đã thêm vào giỏ hàng với số lượng 1.`,
            variant: "warning",
          })
        } else if (!product.is_service && product.stock_quantity < 1) {
          toast({
            title: "Cảnh báo!",
            description: `Sản phẩm "${product.name}" chỉ còn ${product.stock_quantity} sản phẩm. Đã thêm vào giỏ hàng với số lượng 1.`,
            variant: "warning",
          })
        }

        updateActiveOrder({
          cart_items: [
            ...activeOrder.cart_items,
            {
              id: product.id,
              name: product.name,
              price: price,
              cost_price: costPrice,
              quantity: 1,
              stock_quantity: product.stock_quantity, // Still store original stock for display/info if needed
              is_service: product.is_service,
              image_url: product.image_url,
              barcode: product.barcode,
              sku: product.sku, // Added SKU for consistency
            },
          ],
        })
      }
    },
    [activeOrder, toast, updateActiveOrder],
  )

  const updateQuantity = useCallback(
    (id: number, change: number) => {
      const newCart = activeOrder.cart_items
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + change

            // If it's a service, no stock limit
            if (item.is_service) {
              return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
            }

            // For non-service items:
            // Removed all stock checks to allow negative quantities
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0) // Remove item if quantity is 0 or less

      updateActiveOrder({ cart_items: newCart })
    },
    [activeOrder, updateActiveOrder],
  )

  const removeFromCart = useCallback(
    (id: number) => {
      updateActiveOrder({
        cart_items: activeOrder.cart_items.filter((item) => item.id !== id),
      })
    },
    [activeOrder, updateActiveOrder],
  )

  const clearCart = useCallback(() => {
    updateActiveOrder({
      cart_items: [],
      customer_id: null,
      customer: null,
      discount_amount: 0,
      received_amount: 0,
      notes: "Đơn hàng mới",
      tax_rate: globalTaxRate,
    })
  }, [globalTaxRate, updateActiveOrder])

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products
    }
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [products, searchTerm])

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }, [totalPages])

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const filteredCustomers = customers.filter(
    (customer) =>
      debouncedCustomerSearchTerm.trim() &&
      (customer.name.toLowerCase().includes(debouncedCustomerSearchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(debouncedCustomerSearchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(debouncedCustomerSearchTerm.toLowerCase()))),
  )

  const createNewOrder = async () => {
    try {
      if (!isOnline) {
        // Create offline order directly without server call
        const offlineSession = {
          id: Date.now(), // Use timestamp as temporary ID
          user_id: null,
          session_name: `Đơn ${nextOrderNumber}`,
          cart_items: [],
          customer_id: null,
          discount_amount: 0,
          received_amount: 0,
          notes: "Đơn hàng mới (Offline)",
          tax_rate: globalTaxRate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          synced: false,
        }

        setOrderTabs((prev) => [...prev, offlineSession])
        setActiveOrderId(offlineSession.id)
        setNextOrderNumber((prev) => prev + 1)

        toast({
          title: "Đơn hàng offline",
          description: "Đã tạo đơn hàng mới trong chế độ offline.",
          variant: "default",
        })
        return
      }

      // Online mode - attempt server call with error handling
      try {
        const newSession = await createPosSession({
          user_id: null,
          session_name: `Đơn ${nextOrderNumber}`,
          cart_items: [],
          customer_id: null,
          discount_amount: 0,
          received_amount: 0,
          notes: "Đơn hàng mới",
          tax_rate: globalTaxRate,
        })
        setOrderTabs((prev) => [...prev, newSession])
        setActiveOrderId(newSession.id)
        setNextOrderNumber((prev) => prev + 1)
      } catch (serverError) {
        console.error("Server action failed:", serverError)

        // Create offline order as fallback
        const offlineSession = {
          id: Date.now(),
          user_id: null,
          session_name: `Đơn ${nextOrderNumber}`,
          cart_items: [],
          customer_id: null,
          discount_amount: 0,
          received_amount: 0,
          notes: "Đơn hàng mới (Offline)",
          tax_rate: globalTaxRate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          synced: false,
        }

        setOrderTabs((prev) => [...prev, offlineSession])
        setActiveOrderId(offlineSession.id)
        setNextOrderNumber((prev) => prev + 1)

        toast({
          title: "Chế độ offline",
          description: "Server không phản hồi. Đã tạo đơn hàng offline.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Failed to create new POS session:", error)
      toast({
        title: "Lỗi!",
        description: "Không thể tạo đơn hàng mới. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const closeOrder = async (orderId: number) => {
    const orderToClose = orderTabs.find((tab) => tab.id === orderId)

    if (!orderToClose) return

    if (orderToClose.cart_items.length > 0) {
      const confirmed = window.confirm(
        `Đơn hàng "${orderToClose.session_name}" có sản phẩm. Bạn có chắc chắn muốn xóa/làm mới đơn hàng này không?`,
      )
      if (!confirmed) {
        return
      }
    }

    try {
      if (!isOnline) {
        // Handle offline mode - just update local state
        if (orderTabs.length === 1 && orderTabs[0].id === orderId) {
          const updatedSession = {
            ...orderTabs[0],
            cart_items: [],
            customer_id: null,
            discount_amount: 0,
            received_amount: 0,
            notes: "Đơn hàng mới",
            tax_rate: globalTaxRate,
            session_name: "Đơn 1",
          }
          setOrderTabs([updatedSession])
          setNextOrderNumber(2)
        } else {
          const newOrderTabs = orderTabs.filter((order) => order.id !== orderId)
          setOrderTabs(newOrderTabs)

          if (activeOrderId === orderId) {
            setActiveOrderId(newOrderTabs[0]?.id || null)
          }
        }

        toast({
          title: "Thành công (Offline)!",
          description: "Đơn hàng đã được đóng/xóa trong chế độ offline.",
          variant: "success",
        })
        return
      }

      // Online mode - proceed with server calls with error handling
      try {
        if (orderTabs.length === 1 && orderTabs[0].id === orderId) {
          const updatedSession = await updatePosSession(orderId, {
            cart_items: [],
            customer_id: null,
            discount_amount: 0,
            received_amount: 0,
            notes: "Đơn hàng mới",
            tax_rate: globalTaxRate,
            session_name: "Đơn 1",
          })
          setOrderTabs([updatedSession])
          setNextOrderNumber(2)
        } else {
          await deletePosSession(orderId)
          const newOrderTabs = orderTabs.filter((order) => order.id !== orderId)
          setOrderTabs(newOrderTabs)

          if (activeOrderId === orderId) {
            setActiveOrderId(newOrderTabs[0]?.id || null)
          }
        }
        toast({
          title: "Thành công!",
          description: "Đơn hàng đã được đóng/xóa.",
          variant: "success",
        })
      } catch (error) {
        console.error("Failed to close/delete POS session:", error)
        toast({
          title: "Lỗi",
          description: "Không thể đóng/xóa đơn hàng. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Unexpected error closing order:", error)
      toast({
        title: "Lỗi bất ngờ",
        description: "Đã xảy ra lỗi khi đóng đơn hàng.",
        variant: "destructive",
      })
    }
  }

  const handleSelectProduct = useCallback(
    (product: Product) => {
      addToCart(product)
      setSearchTerm("")
      setSearchMessage({ type: null, text: "" }) // Clear search message
    },
    [addToCart, setSearchMessage],
  )

  const handleSearchEnter = useCallback(
    (term: string) => {
      const foundProduct = products.find((p) => p.barcode === term || p.name.toLowerCase().includes(term.toLowerCase()))

      if (foundProduct) {
        handleSelectProduct(foundProduct)
      } else {
        setSearchMessage({
          type: "error",
          text: `Không tìm thấy sản phẩm với mã/tên: "${term}"`,
        })
        setTimeout(() => setSearchMessage({ type: null, text: "" }), 3000)
      }
    },
    [products, handleSelectProduct],
  )

  const handleSelectCustomer = useCallback(
    (customer: Customer | null) => {
      updateActiveOrder({ customer_id: customer?.id || null, customer: customer })
      setCustomerSearchTerm("")
      setSelectedCustomerIndex(-1)
      setShowCustomerDropdown(false)
    },
    [updateActiveOrder],
  )

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setSelectedSearchIndex(-1)
    setSearchMessage({ type: null, text: "" }) // Clear search message on change
  }, [])

  const handleCustomerSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomerSearchTerm(value)

    if (value.trim()) {
      setShowCustomerDropdown(true)
    } else {
      setShowCustomerDropdown(false)
    }
  }, [])

  const subtotal = activeOrder?.cart_items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
  const taxAmount = subtotal * (activeOrder?.tax_rate || 0)
  const total = subtotal + taxAmount - (activeOrder?.discount_amount || 0)
  const itemCount = activeOrder?.cart_items.reduce((sum, item) => sum + item.quantity, 0) || 0

  const handleConfirmOrder = useCallback(
    async (orderData: OrderData) => {
      try {
        const customerToPassToReceipt = activeOrder.customer

        let order: Order | null = null

        if (offlineMode) {
          const offlineOrderId = await offlineSyncService.createOfflineOrder({
            customer_id: orderData.customerId,
            subtotal: activeOrder.cart_items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            tax_amount:
              activeOrder.cart_items.reduce((sum, item) => sum + item.price * item.quantity, 0) * orderData.taxRate,
            discount_amount: orderData.discountAmount,
            total_amount:
              activeOrder.cart_items.reduce((sum, item) => sum + item.price * item.quantity, 0) *
                (1 + orderData.taxRate) -
              orderData.discountAmount,
            payment_method: orderData.paymentMethod,
            payment_status: "completed",
            status: "completed",
            items: activeOrder.cart_items.map((item) => ({
              product_id: item.id,
              product_name: item.name,
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.price * item.quantity,
              is_service: item.is_service,
            })),
          })

          // Create a mock order object for receipt
          order = {
            id: Number.parseInt(offlineOrderId.split("_")[1]) || Date.now(),
            order_number: `OFF-${Date.now().toString().slice(-6)}`,
            customer_id: orderData.customerId,
            subtotal: activeOrder.cart_items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            tax_amount:
              activeOrder.cart_items.reduce((sum, item) => sum + item.price * item.quantity, 0) * orderData.taxRate,
            discount_amount: orderData.discountAmount,
            total_amount:
              activeOrder.cart_items.reduce((sum, item) => sum + item.price * item.quantity, 0) *
                (1 + orderData.taxRate) -
              orderData.discountAmount,
            payment_method: orderData.paymentMethod,
            payment_status: "completed",
            status: "completed",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: null,
            order_items: activeOrder.cart_items.map((item) => ({
              id: item.id,
              order_id: Number.parseInt(offlineOrderId.split("_")[1]) || Date.now(),
              product_id: item.id,
              product_name: item.name,
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.price * item.quantity,
              cost_price: item.cost_price || 0,
              returned_quantity: 0,
              returned_at: null,
              return_reason: null,
              is_service: item.is_service || false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })),
          }

          toast({
            title: "Thành công (Offline)!",
            description: "Đơn hàng đã được lưu offline và sẽ đồng bộ khi có mạng.",
            variant: "success",
          })
        } else {
          order = await createOrderClient(
            orderData.customerId,
            activeOrder.cart_items,
            orderData.paymentMethod,
            orderData.discountAmount,
            orderData.taxRate,
            activeOrder.notes || "",
          )

          toast({
            title: "Thành công!",
            description: "Đơn hàng đã được tạo thành công.",
            variant: "success",
          })
        }

        if (order) {
          setLastOrder(order)
          setLastOrderData(orderData)
          setCustomerForReceipt(customerToPassToReceipt)
          setIsReceiptModalOpen(true)

          if (orderTabs.length === 1) {
            const updatedSession = {
              ...orderTabs[0],
              cart_items: [],
              customer_id: null,
              customer: null,
              discount_amount: 0,
              received_amount: 0,
              notes: "Đơn hàng mới",
              tax_rate: globalTaxRate,
              session_name: "Đơn 1",
            }
            setOrderTabs([updatedSession])
            if (!offlineMode) {
              await updatePosSession(activeOrderId!, {
                cart_items: [],
                customer_id: null,
                customer: null,
                discount_amount: 0,
                received_amount: 0,
                notes: "Đơn hàng mới",
                tax_rate: globalTaxRate,
                session_name: "Đơn 1",
              })
            }
          } else {
            if (!offlineMode) {
              await deletePosSession(activeOrderId!)
            }
            const newOrderTabs = orderTabs.filter((order) => order.id !== activeOrderId)
            setOrderTabs(newOrderTabs)
            if (newOrderTabs.length > 0) {
              setActiveOrderId(newOrderTabs[0].id)
            }
          }
        } else {
          toast({
            title: "Lỗi!",
            description: "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.",
            variant: "destructive",
          })
          console.error("Order creation failed, order object is null.")
        }
      } catch (error) {
        console.error("Checkout error:", error)
        toast({
          title: "Lỗi!",
          description: "Có lỗi xảy ra khi tạo đơn hàng: " + (error as Error).message,
          variant: "destructive",
        })
      }
    },
    [activeOrder, orderTabs, globalTaxRate, toast, activeOrderId, offlineMode],
  )

  const handleDiscountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0
      updateActiveOrder({ discount_amount: value })
    },
    [updateActiveOrder],
  )

  const handleTaxRateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0
      updateActiveOrder({ tax_rate: value / 100 })
    },
    [updateActiveOrder],
  )

  const handleQuickCheckout = useCallback(async () => {
    if (!activeOrder?.cart_items?.length) {
      toast({
        title: "Giỏ hàng trống!",
        description: "Vui lòng thêm sản phẩm trước khi thanh toán.",
        variant: "destructive",
      })
      return
    }

    const total = subtotal + taxAmount - (activeOrder?.discount_amount || 0)

    const orderData = {
      customerId: activeOrder.customer_id,
      items: activeOrder.cart_items,
      discountAmount: activeOrder.discount_amount || 0,
      taxRate: activeOrder?.tax_rate || 0,
      notes: activeOrder?.notes || "",
      receivedAmount: total,
      changeAmount: 0,
    }

    await handleConfirmOrder(orderData)
  }, [activeOrder, toast, handleConfirmOrder, subtotal, taxAmount])

  const loadCustomers = useCallback(async () => {
    try {
      const customerData = await getCustomersClient()
      setCustomers(customerData)
    } catch (error) {
      console.error("Error loading customers:", error)
      toast({
        title: "Lỗi tải khách hàng!",
        description: "Không thể tải danh sách khách hàng.",
        variant: "destructive",
      })
    }
  }, [toast])

  const handleCustomerFormSuccess = useCallback(
    async (newCustomer: Customer) => {
      await loadCustomers()
      if (newCustomer) {
        handleSelectCustomer(newCustomer)
      }
    },
    [loadCustomers, handleSelectCustomer],
  )

  const handleAddQuickService = useCallback(
    (name: string, price: number) => {
      const quickServiceProduct: Product = {
        id: Date.now(),
        name: name,
        retail_price: price,
        wholesale_price: price,
        cost_price: price,
        stock_quantity: Number.POSITIVE_INFINITY,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        price: price,
        is_service: true, // Ensure this is set to true for quick services
        description: null,
        category_id: null,
        barcode: null,
        image_url: null,
        image_data: null,
        min_stock_level: null,
        sku: null,
      }

      addToCart(quickServiceProduct)
    },
    [addToCart],
  )

  const handleUpdateItemPrice = useCallback(
    (id: number, newPrice: number) => {
      const newCart = activeOrder.cart_items.map((item) => (item.id === id ? { ...item, price: newPrice } : item))
      updateActiveOrder({ cart_items: newCart })
    },
    [activeOrder, updateActiveOrder],
  )

  const handleEditProductPrice = useCallback((item: CartItem) => {
    setEditingProduct(item)
    setIsPriceEditModalOpen(true)
  }, [])

  const handleFocusDiscountInput = useCallback(() => {
    const discountInput = document.getElementById("discount-amount") as HTMLInputElement
    if (discountInput) {
      discountInput.focus()
      discountInput.select()
    }
  }, [])

  const handleNavigateToOrders = useCallback(() => {
    router.push("/orders")
  }, [router])

  const handleNavigateToReports = useCallback(() => {
    router.push("/reports")
  }, [router])

  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      if (syncStatus.isOnline) {
        const [productData, customerData, fetchedTaxRate, receiptTemplate, preReceiptTemplate] = await Promise.all([
          getProductsClient(),
          getCustomersClient(),
          getTaxRate(),
          getPrintTemplateByType("receipt"),
          getPrintTemplateByType("pre_receipt"),
        ])

        const productsWithPrice = productData.map((product) => ({
          ...product,
          price: product.wholesale_price,
        }))

        setProducts(productsWithPrice)
        setCustomers(customerData)
        setGlobalTaxRate(fetchedTaxRate)
        setOfflineMode(false)

        await offlineSyncService.forcSync()

        if (receiptTemplate) {
          setDefaultReceiptTemplateContent(receiptTemplate.content)
        } else {
          toast({
            title: "Cảnh báo",
            description: "Không tìm thấy mẫu hóa đơn mặc định. Vui lòng cấu hình trong cài đặt.",
            variant: "warning",
          })
        }

        if (preReceiptTemplate) {
          setDefaultPreReceiptTemplateContent(preReceiptTemplate.content)
        } else {
          toast({
            title: "Cảnh báo",
            description: "Không tìm thấy mẫu tạm tính mặc định. Vui lòng cấu hình trong cài đặt.",
            variant: "warning",
          })
        }

        const sessions = await getPosSessions(null)
        setOrderTabs(sessions)

        if (sessions.length > 0) {
          const activeSession = sessions.find((s) => s.status === "active") || sessions[0]
          setActiveOrderId(activeSession.id)
        }
      } else {
        // Load from offline storage
        const offlineProducts = await indexedDBService.getProducts()
        setProducts(offlineProducts)

        // Set default tax rate when offline
        setGlobalTaxRate(0.1) // 10% default
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      if (syncStatus.isOnline) {
        toast({
          title: "Lỗi tải dữ liệu!",
          description: "Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }, [syncStatus.isOnline, toast])

  const saveIncompleteOrdersToOffline = useCallback(async () => {
    try {
      const incompleteOrders = orderTabs.filter(
        (order) => order.cart_items && order.cart_items.length > 0 && !order.synced,
      )

      for (const order of incompleteOrders) {
        const subtotal = order.cart_items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const taxAmount = subtotal * (order.tax_rate || globalTaxRate)
        const totalAmount = subtotal + taxAmount - (order.discount_amount || 0)

        await offlineSyncService.createOfflineOrder({
          customer_id: order.customer_id || undefined,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: order.discount_amount || 0,
          total_amount: totalAmount,
          payment_method: "cash",
          payment_status: "pending",
          status: "pending",
          items: order.cart_items.map((item) => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            is_service: item.is_service,
          })),
        })

        console.log(`[v0] Saved incomplete order to offline: ${order.session_name}`)
      }

      if (incompleteOrders.length > 0) {
        toast({
          title: "Đơn hàng đã được lưu",
          description: `${incompleteOrders.length} đơn hàng chưa hoàn thành đã được lưu offline.`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error saving incomplete orders to offline:", error)
    }
  }, [orderTabs, globalTaxRate, toast])

  const restoreIncompleteOrdersFromOffline = useCallback(async () => {
    try {
      const offlineOrders = await indexedDBService.getUnsyncedOrders()
      const pendingOrders = offlineOrders.filter(
        (order) => order.status === "pending" && order.payment_status === "pending",
      )

      for (const order of pendingOrders) {
        const restoredOrder = {
          id: Date.now() + Math.random(), // Generate unique ID
          user_id: null,
          session_name: `${order.order_number} (Khôi phục)`,
          cart_items: order.items.map((item) => ({
            id: item.product_id,
            name: item.product_name,
            price: item.unit_price,
            quantity: item.quantity,
            cost_price: 0,
            is_service: item.is_service || false,
          })),
          customer_id: order.customer_id || null,
          discount_amount: order.discount_amount,
          received_amount: 0,
          notes: "Đơn hàng khôi phục từ offline",
          tax_rate: order.tax_amount / order.subtotal || globalTaxRate,
          created_at: order.created_at,
          updated_at: new Date().toISOString(),
          synced: false,
        }

        setOrderTabs((prev) => [...prev, restoredOrder])
        console.log(`[v0] Restored incomplete order: ${order.order_number}`)
      }

      if (pendingOrders.length > 0) {
        toast({
          title: "Đơn hàng đã được khôi phục",
          description: `${pendingOrders.length} đơn hàng chưa hoàn thành đã được khôi phục.`,
          variant: "success",
        })
      }
    } catch (error) {
      console.error("Error restoring incomplete orders from offline:", error)
    }
  }, [globalTaxRate, toast])

  useEffect(() => {
    const unsubscribe = offlineSyncService.onStatusChange((status) => {
      setSyncStatus(status)

      // Switch between online/offline modes
      if (status.isOnline && offlineMode) {
        // Coming back online
        loadInitialData()
        restoreIncompleteOrdersFromOffline()
      } else if (!status.isOnline && !offlineMode) {
        // Going offline
        setOfflineMode(true)
        saveIncompleteOrdersToOffline()
        toast({
          title: "Mất kết nối internet",
          description:
            "Đã chuyển sang chế độ Offline. Các đơn hàng chưa hoàn thành đã được lưu và sẽ được khôi phục khi có mạng trở lại.",
          variant: "warning",
          duration: 5000,
        })
      }
    })

    return unsubscribe
  }, [offlineMode, loadInitialData, toast, restoreIncompleteOrdersFromOffline, saveIncompleteOrdersToOffline])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "F1": // Thanh toán
          event.preventDefault()
          if (activeOrder && activeOrder.cart_items.length > 0) {
            handleQuickCheckout()
          } else {
            toast({
              title: "Không thể thanh toán",
              description: "Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.",
              variant: "destructive",
            })
          }
          break

        case "F2": // In tạm tính
          event.preventDefault()
          if (activeOrder && activeOrder.cart_items.length > 0) {
            setIsPreReceiptModalOpen(true)
          } else {
            toast({
              title: "Không thể in tạm tính",
              description: "Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi in.",
              variant: "destructive",
            })
          }
          break

        case "F9": // Dịch vụ nhanh
          event.preventDefault()
          setIsQuickServiceModalOpen(true)
          break

        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeOrder, toast, handleQuickCheckout])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="ml-4 text-lg text-gray-600">Đang tải dữ liệu...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {offlineMode && (
        <div className="bg-orange-500 text-white px-4 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>Chế độ Offline - Đơn hàng sẽ được đồng bộ khi có mạng</span>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus.pendingOrders > 0 && (
              <span className="bg-orange-600 px-2 py-1 rounded text-xs">
                {syncStatus.pendingOrders} đơn chờ đồng bộ
              </span>
            )}
            {syncStatus.syncInProgress && <RefreshCw className="h-4 w-4 animate-spin" />}
          </div>
        </div>
      )}

      {syncStatus.isOnline && syncStatus.pendingOrders > 0 && (
        <div className="bg-blue-500 text-white px-4 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            <span>Đang đồng bộ {syncStatus.pendingOrders} đơn hàng offline...</span>
          </div>
          {syncStatus.syncInProgress && <RefreshCw className="h-4 w-4 animate-spin" />}
        </div>
      )}

      <PosHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchEnter={handleSearchEnter}
        filteredProducts={filteredProducts}
        showSearchDropdown={searchTerm.trim().length > 0 && filteredProducts.length > 0}
        setShowSearchDropdown={() => {}}
        selectedSearchIndex={selectedSearchIndex}
        setSelectedSearchIndex={setSelectedSearchIndex}
        onSelectProduct={handleSelectProduct}
        searchMessage={searchMessage}
        setSearchMessage={setSearchMessage}
        orderTabs={orderTabs}
        activeOrderId={activeOrderId}
        onSetActiveOrder={setActiveOrderId}
        onCreateNewOrder={createNewOrder}
        onCloseOrder={closeOrder}
        onShowShortcutHelp={() => setIsShortcutHelpModalOpen(true)}
      />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col bg-white min-h-0">
          <PosCartDisplay
            cartItems={activeOrder?.cart_items || []}
            products={products} // Keep this prop as it's used in PosCartDisplay
            activeOrderName={activeOrder?.session_name || "Đơn tạm"} // Keep this prop
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onEditPrice={handleEditProductPrice}
          />

          <PosProductGrid
            activeTab={activeTab}
            onTabChange={setActiveTab}
            products={filteredProducts}
            searchTerm={searchTerm}
            currentPage={currentPage}
            totalPages={totalPages}
            productsPerPage={productsPerPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onAddToCart={addToCart}
            onShowQuickServiceModal={() => setIsQuickServiceModalOpen(true)}
            onClearCart={clearCart}
            onFocusDiscountInput={handleFocusDiscountInput}
            onNavigateToOrders={handleNavigateToOrders}
            onNavigateToReports={handleNavigateToReports}
            filteredProductsCount={filteredProducts.length}
          />
        </div>

        <PosSummaryPanel
          customer={activeOrder?.customer || null}
          onSelectCustomer={handleSelectCustomer}
          onShowCustomerFormModal={() => setIsPriceEditModalOpen(true)}
          subtotal={subtotal}
          taxRate={activeOrder?.tax_rate || 0}
          discountAmount={activeOrder?.discount_amount || 0}
          total={total}
          itemCount={itemCount}
          onDiscountChange={handleDiscountChange}
          onTaxRateChange={handleTaxRateChange}
          onQuickCheckout={handleQuickCheckout}
          onPrintPreReceipt={() => {
            if (activeOrder?.cart_items.length === 0) {
              toast({
                title: "Giỏ hàng trống!",
                description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi in tạm tính.",
                variant: "warning",
              })
              return
            }
            setIsPreReceiptModalOpen(true)
          }}
          customerSearchTerm={customerSearchTerm}
          onCustomerSearchChange={handleCustomerSearchChange}
          filteredCustomers={filteredCustomers}
          showCustomerDropdown={showCustomerDropdown}
          setShowCustomerDropdown={setShowCustomerDropdown}
          selectedCustomerIndex={selectedCustomerIndex}
          setSelectedCustomerIndex={setSelectedCustomerIndex}
          setCustomerFormDefaultName={setCustomerFormDefaultName}
        />
      </div>

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false)
          setCustomerForReceipt(null)
        }}
        order={lastOrder}
        customer={customerForReceipt}
        orderData={lastOrderData}
        templateContent={defaultReceiptTemplateContent}
      />

      <PreReceiptModal
        isOpen={isPreReceiptModalOpen}
        onClose={() => setIsPreReceiptModalOpen(false)}
        cartItems={activeOrder?.cart_items || []}
        customer={activeOrder?.customer || null}
        subtotal={subtotal}
        taxRate={activeOrder?.tax_rate || 0}
        discountAmount={activeOrder?.discount_amount || 0}
        templateContent={defaultPreReceiptTemplateContent}
      />

      <CustomerFormModal
        isOpen={isPriceEditModalOpen}
        onClose={() => {
          setIsPriceEditModalOpen(false)
          setCustomerFormDefaultName("")
        }}
        onSuccess={handleCustomerFormSuccess}
        initialData={null}
        defaultName={customerFormDefaultName}
      />

      <ShortcutHelpModal isOpen={isShortcutHelpModalOpen} onClose={() => setIsShortcutHelpModalOpen(false)} />

      <QuickServiceModal
        isOpen={isQuickServiceModalOpen}
        onClose={() => setIsQuickServiceModalOpen(false)}
        onAddService={handleAddQuickService}
      />

      {editingProduct && (
        <PriceEditModal
          isOpen={isPriceEditModalOpen}
          onClose={() => setIsPriceEditModalOpen(false)}
          currentPrice={editingProduct.price}
          onSave={(newPrice) => handleUpdateItemPrice(editingProduct!.id, newPrice)}
        />
      )}
    </div>
  )
}
