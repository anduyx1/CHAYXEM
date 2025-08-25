import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import "server-only"

export function createClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not configured for server. Using mock data.")
    return null
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookies().set(name, value, options)
        } catch {
          // The `cookies()` may not be available in a Server Component context
          // that is rendering a page or layout. If this happens, you can
          // consider making the component a Client Component with "use client".
          // console.warn("Could not set cookie:", error);
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookies().set(name, "", options)
        } catch {
          // console.warn("Could not remove cookie:", error);
        }
      },
    },
  })
}
