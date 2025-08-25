import type { Product, Customer, Order, Category } from "@/lib/types/database"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  stock_quantity: number
}

// Mock data for development
export const initialMockProducts: Product[] = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    description: "Điện thoại iPhone 15 Pro Max 256GB",
    retail_price: 25000000,
    wholesale_price: 23000000,
    cost_price: 22000000,
    category: "Điện thoại",
    stock_quantity: 15,
    min_stock_level: 5,
    barcode: "1234567890123",
    image_url: "https://picsum.photos/seed/iphone15/500/500",
    image_data: JSON.stringify({
      size: 150000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "MacBook Air M2",
    description: "MacBook Air M2 13 inch 256GB",
    retail_price: 30000000,
    wholesale_price: 28000000,
    cost_price: 26000000,
    category: "Laptop",
    stock_quantity: 8,
    min_stock_level: 3,
    barcode: "1234567890124",
    image_url: "https://picsum.photos/seed/macbook/500/500",
    image_data: JSON.stringify({
      size: 180000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "AirPods Pro 2",
    description: "Tai nghe AirPods Pro thế hệ 2",
    retail_price: 5000000,
    wholesale_price: 4500000,
    cost_price: 4200000,
    category: "Phụ kiện",
    stock_quantity: 25,
    min_stock_level: 10,
    barcode: "1234567890125",
    image_url: "https://picsum.photos/seed/airpods/500/500",
    image_data: JSON.stringify({
      size: 120000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: "iPad Air M1",
    description: "iPad Air M1 64GB WiFi",
    retail_price: 15000000,
    wholesale_price: 14000000,
    cost_price: 13000000,
    category: "Tablet",
    stock_quantity: 12,
    min_stock_level: 5,
    barcode: "1234567890126",
    image_url: "https://picsum.photos/seed/ipad/500/500",
    image_data: JSON.stringify({
      size: 140000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Apple Watch Series 9",
    description: "Apple Watch Series 9 45mm",
    retail_price: 8000000,
    wholesale_price: 7500000,
    cost_price: 7000000,
    category: "Đồng hồ",
    stock_quantity: 20,
    min_stock_level: 8,
    barcode: "1234567890127",
    image_url: "https://picsum.photos/seed/watch/500/500",
    image_data: JSON.stringify({
      size: 130000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: "Magic Mouse",
    description: "Chuột Magic Mouse 2",
    retail_price: 2000000,
    wholesale_price: 1800000,
    cost_price: 1700000,
    category: "Phụ kiện",
    stock_quantity: 30,
    min_stock_level: 15,
    barcode: "1234567890128",
    image_url: "https://picsum.photos/seed/mouse/500/500",
    image_data: JSON.stringify({
      size: 110000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: "Samsung Galaxy S24 Ultra",
    description: "Điện thoại Samsung Galaxy S24 Ultra 512GB",
    retail_price: 28000000,
    wholesale_price: 26000000,
    cost_price: 24000000,
    category: "Điện thoại",
    stock_quantity: 10,
    min_stock_level: 3,
    barcode: "1234567890129",
    image_url: "https://picsum.photos/seed/galaxys24/500/500",
    image_data: JSON.stringify({
      size: 160000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 8,
    name: "Dell XPS 15",
    description: "Laptop Dell XPS 15 i7 16GB RAM",
    retail_price: 35000000,
    wholesale_price: 32000000,
    cost_price: 30000000,
    category: "Laptop",
    stock_quantity: 7,
    min_stock_level: 2,
    barcode: "1234567890130",
    image_url: "https://picsum.photos/seed/dellxps/500/500",
    image_data: JSON.stringify({
      size: 190000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 9,
    name: "Sony WH-1000XM5",
    description: "Tai nghe chống ồn Sony WH-1000XM5",
    retail_price: 7000000,
    wholesale_price: 6500000,
    cost_price: 6000000,
    category: "Phụ kiện",
    stock_quantity: 18,
    min_stock_level: 7,
    barcode: "1234567890131",
    image_url: "https://picsum.photos/seed/sonywh/500/500",
    image_data: JSON.stringify({
      size: 130000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 10,
    name: "Microsoft Surface Pro 9",
    description: "Máy tính bảng Microsoft Surface Pro 9",
    retail_price: 22000000,
    wholesale_price: 20000000,
    cost_price: 18000000,
    category: "Tablet",
    stock_quantity: 9,
    min_stock_level: 4,
    barcode: "1234567890132",
    image_url: "https://picsum.photos/seed/surfacepro/500/500",
    image_data: JSON.stringify({
      size: 150000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 11,
    name: "Garmin Fenix 7",
    description: "Đồng hồ thông minh Garmin Fenix 7",
    retail_price: 12000000,
    wholesale_price: 11000000,
    cost_price: 10000000,
    category: "Đồng hồ",
    stock_quantity: 15,
    min_stock_level: 6,
    barcode: "1234567890133",
    image_url: "https://picsum.photos/seed/garminfenix/500/500",
    image_data: JSON.stringify({
      size: 140000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 12,
    name: "Logitech MX Master 3S",
    description: "Chuột không dây Logitech MX Master 3S",
    retail_price: 2500000,
    wholesale_price: 2300000,
    cost_price: 2100000,
    category: "Phụ kiện",
    stock_quantity: 28,
    min_stock_level: 12,
    barcode: "1234567890134",
    image_url: "https://picsum.photos/seed/logitechmx/500/500",
    image_data: JSON.stringify({
      size: 120000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 13,
    name: "Google Pixel 8 Pro",
    description: "Điện thoại Google Pixel 8 Pro 256GB",
    retail_price: 23000000,
    wholesale_price: 21000000,
    cost_price: 19000000,
    category: "Điện thoại",
    stock_quantity: 12,
    min_stock_level: 4,
    barcode: "1234567890135",
    image_url: "https://picsum.photos/seed/pixel8pro/500/500",
    image_data: JSON.stringify({
      size: 155000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 14,
    name: "HP Spectre x360",
    description: "Laptop HP Spectre x360 14 inch",
    retail_price: 32000000,
    wholesale_price: 29000000,
    cost_price: 27000000,
    category: "Laptop",
    stock_quantity: 6,
    min_stock_level: 2,
    barcode: "1234567890136",
    image_url: "https://picsum.photos/seed/hpspectre/500/500",
    image_data: JSON.stringify({
      size: 185000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 15,
    name: "Bose QuietComfort Earbuds II",
    description: "Tai nghe không dây Bose QuietComfort Earbuds II",
    retail_price: 6000000,
    wholesale_price: 5500000,
    cost_price: 5000000,
    category: "Phụ kiện",
    stock_quantity: 20,
    min_stock_level: 8,
    barcode: "1234567890137",
    image_url: "https://picsum.photos/seed/boseqc/500/500",
    image_data: JSON.stringify({
      size: 125000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 16,
    name: "Lenovo Tab P11 Pro Gen 2",
    description: "Máy tính bảng Lenovo Tab P11 Pro Gen 2",
    retail_price: 10000000,
    wholesale_price: 9000000,
    cost_price: 8500000,
    category: "Tablet",
    stock_quantity: 10,
    min_stock_level: 3,
    barcode: "1234567890138",
    image_url: "https://picsum.photos/seed/lenovotab/500/500",
    image_data: JSON.stringify({
      size: 145000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 17,
    name: "Fitbit Sense 2",
    description: "Đồng hồ thông minh Fitbit Sense 2",
    retail_price: 6500000,
    wholesale_price: 6000000,
    cost_price: 5500000,
    category: "Đồng hồ",
    stock_quantity: 18,
    min_stock_level: 7,
    barcode: "1234567890139",
    image_url: "https://picsum.photos/seed/fitbitsense/500/500",
    image_data: JSON.stringify({
      size: 135000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 18,
    name: "Razer DeathAdder V3 Pro",
    description: "Chuột gaming Razer DeathAdder V3 Pro",
    retail_price: 3000000,
    wholesale_price: 2800000,
    cost_price: 2600000,
    category: "Phụ kiện",
    stock_quantity: 25,
    min_stock_level: 10,
    barcode: "1234567890140",
    image_url: "https://picsum.photos/seed/razerdeathadder/500/500",
    image_data: JSON.stringify({
      size: 115000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 19,
    name: "OnePlus 12",
    description: "Điện thoại OnePlus 12 512GB",
    retail_price: 20000000,
    wholesale_price: 18000000,
    cost_price: 16000000,
    category: "Điện thoại",
    stock_quantity: 10,
    min_stock_level: 3,
    barcode: "1234567890141",
    image_url: "https://picsum.photos/seed/oneplus12/500/500",
    image_data: JSON.stringify({
      size: 165000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 20,
    name: "Asus ROG Zephyrus G14",
    description: "Laptop gaming Asus ROG Zephyrus G14",
    retail_price: 40000000,
    wholesale_price: 37000000,
    cost_price: 35000000,
    category: "Laptop",
    stock_quantity: 5,
    min_stock_level: 1,
    barcode: "1234567890142",
    image_url: "https://picsum.photos/seed/asusrog/500/500",
    image_data: JSON.stringify({
      size: 200000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 21,
    name: "JBL Flip 6",
    description: "Loa Bluetooth di động JBL Flip 6",
    retail_price: 3000000,
    wholesale_price: 2700000,
    cost_price: 2500000,
    category: "Phụ kiện",
    stock_quantity: 35,
    min_stock_level: 15,
    barcode: "1234567890143",
    image_url: "https://picsum.photos/seed/jblflip6/500/500",
    image_data: JSON.stringify({
      size: 100000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 22,
    name: "Xiaomi Pad 6",
    description: "Máy tính bảng Xiaomi Pad 6 128GB",
    retail_price: 8000000,
    wholesale_price: 7500000,
    cost_price: 7000000,
    category: "Tablet",
    stock_quantity: 15,
    min_stock_level: 5,
    barcode: "1234567890144",
    image_url: "https://picsum.photos/seed/xiaomipad6/500/500",
    image_data: JSON.stringify({
      size: 130000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 23,
    name: "Huawei Watch GT 4",
    description: "Đồng hồ thông minh Huawei Watch GT 4",
    retail_price: 5000000,
    wholesale_price: 4500000,
    cost_price: 4000000,
    category: "Đồng hồ",
    stock_quantity: 22,
    min_stock_level: 9,
    barcode: "1234567890145",
    image_url: "https://picsum.photos/seed/huaweiwatch/500/500",
    image_data: JSON.stringify({
      size: 120000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 24,
    name: "Samsung Galaxy Buds2 Pro",
    description: "Tai nghe không dây Samsung Galaxy Buds2 Pro",
    retail_price: 4000000,
    wholesale_price: 3500000,
    cost_price: 3200000,
    category: "Phụ kiện",
    stock_quantity: 28,
    min_stock_level: 12,
    barcode: "1234567890146",
    image_url: "https://picsum.photos/seed/galaxybuds/500/500",
    image_data: JSON.stringify({
      size: 110000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 25,
    name: "Oppo Find X6 Pro",
    description: "Điện thoại Oppo Find X6 Pro 512GB",
    retail_price: 26000000,
    wholesale_price: 24000000,
    cost_price: 22000000,
    category: "Điện thoại",
    stock_quantity: 8,
    min_stock_level: 3,
    barcode: "1234567890147",
    image_url: "https://picsum.photos/seed/oppofindx6/500/500",
    image_data: JSON.stringify({
      size: 170000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 26,
    name: "Acer Predator Helios 300",
    description: "Laptop gaming Acer Predator Helios 300",
    retail_price: 38000000,
    wholesale_price: 35000000,
    cost_price: 33000000,
    category: "Laptop",
    stock_quantity: 4,
    min_stock_level: 1,
    barcode: "1234567890148",
    image_url: "https://picsum.photos/seed/acerpredator/500/500",
    image_data: JSON.stringify({
      size: 195000,
      type: "image/jpeg",
      width: 500,
      height: 500,
      uploaded_at: new Date().toISOString(),
    }),
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Update productIdCounter to reflect the new total number of products
let productIdCounter = 27 // Start from 27 since we now have 26 initial products

export const initialMockCustomers: Customer[] = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    phone: "0901234567",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    date_of_birth: null,
    customer_type: "vip",
    total_spent: 45000000,
    total_orders: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    email: "tranthibinh@email.com",
    phone: "0907654321",
    address: "456 Đường DEF, Quận 2, TP.HCM",
    date_of_birth: null,
    customer_type: "regular",
    total_spent: 25000000,
    total_orders: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Lê Văn Cường",
    email: "levancuong@email.com",
    phone: "0912345678",
    address: "789 Đường GHI, Quận 3, TP.HCM",
    date_of_birth: null,
    customer_type: "vip",
    total_spent: 67000000,
    total_orders: 22,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Phạm Thị Dung",
    email: "phamthidung@email.com",
    phone: "0987654321",
    address: "321 Đường JKL, Quận 4, TP.HCM",
    date_of_birth: null,
    customer_type: "new",
    total_spent: 8000000,
    total_orders: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Hoàng Văn Em",
    email: "hoangvanem@email.com",
    phone: "0934567890",
    address: "654 Đường MNO, Quận 5, TP.HCM",
    date_of_birth: null,
    customer_type: "regular",
    total_spent: 18000000,
    total_orders: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const initialMockCategories: Category[] = [
  { id: 1, name: "Điện thoại", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: "Laptop", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: "Phụ kiện", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: "Tablet", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, name: "Đồng hồ", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

// In-memory storage for mock data
let mockProductsData: Product[] = [...initialMockProducts]
let mockCustomersData: Customer[] = [...initialMockCustomers]
let mockOrdersData: Order[] = []
let mockCategoriesData: Category[] = [...initialMockCategories]
let customerIdCounter = 6 // Start from 6 since we have 5 initial customers
let orderIdCounter = 1
let categoryIdCounter = 6 // Start from 6 for categories

// Product operations
export function getMockProducts(): Product[] {
  return mockProductsData.filter((p) => p.status === "active")
}

export function getMockProductById(id: number): Product | null {
  return mockProductsData.find((p) => p.id === id) || null
}

export function createMockProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Product {
  const newProduct: Product = {
    ...product,
    id: productIdCounter++,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockProductsData.push(newProduct)
  return newProduct
}

export function updateMockProduct(id: number, updates: Partial<Product>): Product | null {
  const productIndex = mockProductsData.findIndex((p) => p.id === id)
  if (productIndex === -1) return null

  mockProductsData[productIndex] = {
    ...mockProductsData[productIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  return mockProductsData[productIndex]
}

export function deleteMockProduct(id: number): boolean {
  const productIndex = mockProductsData.findIndex((p) => p.id === id)
  if (productIndex === -1) return false

  mockProductsData[productIndex] = {
    ...mockProductsData[productIndex],
    status: "inactive" as const,
    updated_at: new Date().toISOString(),
  }
  return true
}

export function updateMockProductStock(id: number, newStock: number): boolean {
  const productIndex = mockProductsData.findIndex((p) => p.id === id)
  if (productIndex !== -1) {
    mockProductsData[productIndex] = {
      ...mockProductsData[productIndex],
      stock_quantity: newStock,
      updated_at: new Date().toISOString(),
    }
    return true
  }
  return false
}

// Customer operations
export function getMockCustomers(): Customer[] {
  return mockCustomersData
}

export function getMockCustomerById(id: number): Customer | null {
  return mockCustomersData.find((c) => c.id === id) || null
}

export function createMockCustomer(
  customer: Omit<Customer, "id" | "created_at" | "updated_at" | "total_spent" | "total_orders">,
): Customer {
  const newCustomer: Customer = {
    ...customer,
    id: customerIdCounter++,
    total_spent: 0,
    total_orders: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockCustomersData.push(newCustomer)
  return newCustomer
}

export function updateMockCustomer(id: number, updates: Partial<Customer>): Customer | null {
  const customerIndex = mockCustomersData.findIndex((c) => c.id === id)
  if (customerIndex === -1) return null

  mockCustomersData[customerIndex] = {
    ...mockCustomersData[customerIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  return mockCustomersData[customerIndex]
}

export function deleteMockCustomer(id: number): boolean {
  const initialLength = mockCustomersData.length
  mockCustomersData = mockCustomersData.filter((c) => c.id !== id)
  return mockCustomersData.length < initialLength
}

// Order operations
export function getMockOrders(): Order[] {
  return mockOrdersData
}

export function createMockOrder(
  customerId: number | null,
  cartItems: CartItem[],
  paymentMethod: string,
  discountAmount: number,
  taxRate: number,
): Order {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxAmount = subtotal * taxRate
  const totalAmount = subtotal + taxAmount - discountAmount

  const order: Order = {
    id: orderIdCounter++,
    customer_id: customerId,
    order_number: `ORD-${Date.now()}`,
    subtotal,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    payment_method: paymentMethod,
    payment_status: "completed" as const,
    order_status: "completed" as const,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_items: cartItems.map((item, index) => ({
      id: index + 1,
      order_id: orderIdCounter - 1,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      created_at: new Date().toISOString(),
    })),
  }

  mockOrdersData.push(order)

  // Update product stock
  cartItems.forEach((item) => {
    updateMockProductStock(item.id, item.stock_quantity - item.quantity)
  })

  // Update customer stats if customer exists
  if (customerId) {
    const customerIndex = mockCustomersData.findIndex((c) => c.id === customerId)
    if (customerIndex !== -1) {
      const customer = mockCustomersData[customerIndex]
      const newTotalSpent = customer.total_spent + totalAmount
      const newTotalOrders = customer.total_orders + 1

      let customerType: "new" | "regular" | "vip" = "regular"
      if (newTotalSpent >= 50000000) {
        customerType = "vip"
      } else if (newTotalOrders === 1) {
        customerType = "new"
      }

      mockCustomersData[customerIndex] = {
        ...customer,
        total_spent: newTotalSpent,
        total_orders: newTotalOrders,
        customer_type: customerType,
        updated_at: new Date().toISOString(),
      }
    }
  }

  return order
}

export function getMockTodayStats(): { totalSales: number; totalOrders: number; averageOrderValue: number } {
  return {
    totalSales: 35000000,
    totalOrders: 15,
    averageOrderValue: 2333333,
  }
}

export function getMockMonthlyStats(): { totalSales: number; totalOrders: number; averageOrderValue: number } {
  return {
    totalSales: 1250000000,
    totalOrders: 250,
    averageOrderValue: 5000000,
  }
}

// Category operations
export function getMockCategories(): Category[] {
  return mockCategoriesData
}

export function createMockCategory(name: string): Category {
  const newCategory: Category = {
    id: categoryIdCounter++,
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockCategoriesData.push(newCategory)
  return newCategory
}

export function updateMockCategory(id: number, name: string): Category | null {
  const categoryIndex = mockCategoriesData.findIndex((c) => c.id === id)
  if (categoryIndex === -1) return null

  mockCategoriesData[categoryIndex] = {
    ...mockCategoriesData[categoryIndex],
    name,
    updated_at: new Date().toISOString(),
  }
  return mockCategoriesData[categoryIndex]
}

export function deleteMockCategory(id: number): boolean {
  const initialLength = mockCategoriesData.length
  mockCategoriesData = mockCategoriesData.filter((c) => c.id !== id)
  return mockCategoriesData.length < initialLength
}

export function getMockSalesData(): Array<{ sale_date: string; total_sales: number }> {
  return [
    { sale_date: "2023-01-01", total_sales: 1200 },
    { sale_date: "2023-01-02", total_sales: 1500 },
    { sale_date: "2023-01-03", total_sales: 1000 },
    { sale_date: "2023-01-04", total_sales: 1800 },
    { sale_date: "2023-01-05", total_sales: 1300 },
    { sale_date: "2023-01-06", total_sales: 2000 },
    { sale_date: "2023-01-07", total_sales: 1700 },
  ]
}

export function getMockTopProducts(): Array<{
  product_name: string
  total_quantity_sold: number
  total_sales_amount: number
}> {
  return [
    { product_name: "Laptop Gaming XYZ", total_quantity_sold: 15, total_sales_amount: 250000000 },
    { product_name: "Điện thoại ABC", total_quantity_sold: 30, total_sales_amount: 150000000 },
    { product_name: "Tai nghe Bluetooth", total_quantity_sold: 50, total_sales_amount: 50000000 },
    { product_name: "Bàn phím cơ", total_quantity_sold: 25, total_sales_amount: 30000000 },
    { product_name: "Chuột không dây", total_quantity_sold: 40, total_sales_amount: 20000000 },
  ]
}

export function getMockCustomerSpending() {
  return [
    { customer_name: "Nguyễn Văn A", total_orders: 5, total_spent: 300000000 },
    { customer_name: "Trần Thị B", total_orders: 3, total_spent: 180000000 },
    { customer_name: "Lê Văn C", total_orders: 7, total_spent: 120000000 },
    { customer_name: "Phạm Thị D", total_orders: 2, total_spent: 90000000 },
    { customer_name: "Hoàng Văn E", total_orders: 4, total_spent: 75000000 },
    { customer_name: "Khách lẻ", total_orders: 10, total_spent: 50000000 },
  ]
}

export function getMockSalesSummary() {
  return {
    totalSales: 1250000000,
    totalOrders: 250,
    averageOrderValue: 5000000,
    totalRefunds: 15000000,
  }
}

export function getMockSalesByPaymentMethod() {
  return [
    { payment_method: "Tiền mặt", total_amount: 600000000 },
    { payment_method: "Chuyển khoản", total_amount: 400000000 },
    { payment_method: "Thẻ tín dụng", total_amount: 200000000 },
    { payment_method: "Ví điện tử", total_amount: 50000000 },
  ]
}

export function getMockSalesTrend() {
  return [
    { date: "2024-06-20", total_sales: 15000000 },
    { date: "2024-06-21", total_sales: 22000000 },
    { date: "2024-06-22", total_sales: 18000000 },
    { date: "2024-06-23", total_sales: 25000000 },
    { date: "2024-06-24", total_sales: 30000000 },
    { date: "2024-06-25", total_sales: 28000000 },
    { date: "2024-06-26", total_sales: 35000000 },
  ]
}

// Reset function for testing
export function resetMockData(): void {
  mockProductsData = [...initialMockProducts]
  mockCustomersData = [...initialMockCustomers]
  mockOrdersData = []
  mockCategoriesData = [...initialMockCategories]
  productIdCounter = 27
  customerIdCounter = 6
  orderIdCounter = 1
  categoryIdCounter = 6
}
