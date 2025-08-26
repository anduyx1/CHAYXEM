// Fallback in-memory storage when database is unavailable
interface StorageData {
  settings: Record<string, any>
  businessSettings: Record<string, any>
  products: any[]
  customers: any[]
  orders: any[]
  categories: any[]
}

class FallbackStorage {
  private data: StorageData = {
    settings: {
      businessName: "Demo Store",
      currency: "USD",
      taxRate: "10",
      enableTax: "true"
    },
    businessSettings: {
      businessName: "Demo Store",
      businessAddress: "123 Main St",
      businessPhone: "+1-555-0123",
      businessEmail: "demo@store.com",
      businessWebsite: "https://demo-store.com",
      businessTaxId: "TAX123456",
      businessLogo: "",
      currency: "USD",
      taxRate: "10",
      enableTax: "true",
      enableDiscount: "true",
      enableCustomerInfo: "true",
      receiptFooter: "Thank you for your business!"
    },
    products: [],
    customers: [],
    orders: [],
    categories: [
      { id: 1, name: "Electronics", description: "Electronic items" },
      { id: 2, name: "Clothing", description: "Apparel and accessories" },
      { id: 3, name: "Food & Beverage", description: "Food and drinks" }
    ]
  }

  // Settings operations
  getSettings(): Record<string, string> {
    return this.data.settings
  }

  setSettings(settings: Record<string, any>): void {
    this.data.settings = { ...this.data.settings, ...settings }
  }

  // Business settings operations
  getBusinessSettings(): Record<string, string> {
    return this.data.businessSettings
  }

  setBusinessSettings(settings: Record<string, any>): void {
    this.data.businessSettings = { ...this.data.businessSettings, ...settings }
  }

  // Generic query simulation
  async query(sql: string, params: any[] = []): Promise<any[]> {
    // Simple query simulation for basic operations
    if (sql.includes('SELECT') && sql.includes('settings')) {
      if (sql.includes('business_settings')) {
        return Object.entries(this.data.businessSettings).map(([key, value]) => ({
          setting_key: key,
          setting_value: value
        }))
      } else {
        return Object.entries(this.data.settings).map(([key, value]) => ({
          key,
          value
        }))
      }
    }
    
    if (sql.includes('SELECT') && sql.includes('categories')) {
      return this.data.categories
    }

    // For INSERT/UPDATE operations, just return success
    return []
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (sql.includes('INSERT') || sql.includes('UPDATE')) {
      // Simulate successful insert/update
      return { affectedRows: 1, insertId: Math.floor(Math.random() * 1000) }
    }
    return this.query(sql, params)
  }

  release(): void {
    // No-op for in-memory storage
  }
}

export const fallbackStorage = new FallbackStorage()