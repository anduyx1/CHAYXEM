import { getSuppliers } from "@/lib/actions/suppliers"
import type { Supplier } from "@/lib/types/database"

export async function getSuppliersClient(): Promise<Supplier[]> {
  try {
    const result = await getSuppliers()
    if (result.success) {
      return result.data
    } else {
      console.error("Error fetching suppliers:", result.error)
      return []
    }
  } catch (error) {
    console.error("Error in getSuppliersClient:", error)
    return []
  }
}
