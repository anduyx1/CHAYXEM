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
