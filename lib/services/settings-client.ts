"use client"

import { getStoreSettings, updateStoreSettings, getAppSettings } from "@/lib/actions/settings"
import type { StoreSettings, Settings } from "@/lib/types/database"

export const getStoreSettingsClient = async (): Promise<StoreSettings> => {
  return await getStoreSettings()
}

export const updateStoreSettingsClient = async (settings: StoreSettings): Promise<StoreSettings> => {
  return await updateStoreSettings(settings)
}

export const getPosAppSettings = async (): Promise<Settings | null> => {
  return await getAppSettings()
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  try {
    const response = await fetch('/api/settings/business')
    
    if (response.status === 503) {
      // Database unavailable, try to get from IndexedDB
      const offlineSync = new OfflineSyncService()
      const cachedSettings = await offlineSync.indexedDB.getSettings()
      if (cachedSettings) {
        return cachedSettings
      }
      // Return default settings if no cache available
      return getDefaultBusinessSettings()
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch business settings')
    }
    return await response.json()
  } catch (error) {
    console.warn('Failed to fetch business settings, using defaults:', error)
    return getDefaultBusinessSettings()
  }
}

function getDefaultBusinessSettings(): BusinessSettings {
  return {
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    businessWebsite: "",
    businessTaxId: "",
    businessLogo: "",
    currency: "VND",
    taxRate: 10,
    enableTax: true,
    enableDiscount: true,
    enableCustomerInfo: true,
    receiptFooter: "Cảm ơn quý khách đã mua hàng!",
  }
}