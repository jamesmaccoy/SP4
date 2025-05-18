declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string

      // r2 storage
      R2_BUCKET: string
      R2_REGION: string
      R2_ACCESS_KEY_ID: string
      R2_SECRET_ACCESS_KEY: string
      R2_ENDPOINT: string

      CUSTOMER_ID_APPEND_FORMS: string

      // RevenueCat
      NEXT_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY: string
      REVENUECAT_SECRET_API_KEY: string

      JWT_SECRET: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
