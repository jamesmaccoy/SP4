import { BetaAnalyticsDataClient } from '@google-analytics/data'
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    console.log('Service Account Details:')
    console.log('- Project ID:', serviceAccount.project_id)
    console.log('- Client Email:', serviceAccount.client_email)
    console.log('- Private Key Length:', serviceAccount.private_key?.length || 0)
  } else {
    console.error('GOOGLE_SERVICE_ACCOUNT_JSON is empty or undefined')
  }
} catch (e) {
  console.error('Error parsing service account JSON:', e)
  console.error('Raw JSON:', process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
}
let analyticsDataClient: any = null
// Initialize the analytics client
try {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) {
    console.error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set')
  } else {
    try {
      const credentials = JSON.parse(serviceAccountJson)
      analyticsDataClient = new BetaAnalyticsDataClient({
        credentials,
      })
      console.log('Analytics client initialized successfully')
    } catch (parseError) {
      console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:', parseError)
      console.error('Service account JSON content:', serviceAccountJson)
    }
  }
} catch (e) {
  console.error('Error initializing analytics client:', e)
}
export const getAnalyticsData = async () => {
  if (!analyticsDataClient) {
    console.error('Analytics client not initialized. Checking environment variables...')
    console.error('GA4_PROPERTY_ID:', process.env.GA4_PROPERTY_ID)
    console.error('GOOGLE_SERVICE_ACCOUNT_JSON exists:', !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    return {
      activeUsersNow: 0,
      total30DayUsers: 0,
      total30DayViews: 0,
      historicalData: [],
    }
  }
  try {
    // Get realtime data
    console.log('Fetching realtime data...')
    console.log('Using property ID:', process.env.GA4_PROPERTY_ID)
    const realtimeResponse = await analyticsDataClient.runRealtimeReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dimensions: [{ name: 'minutesAgo' }],
      metrics: [{ name: 'activeUsers' }],
    })
    console.log('Raw realtime response:', JSON.stringify(realtimeResponse, null, 2))
    // Get historical data
    console.log('Fetching historical data...')
    const historicalResponse = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
    })
    console.log('Raw historical response:', JSON.stringify(historicalResponse, null, 2))
    // Process realtime data
    const activeUsersNow = realtimeResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || '0'
    console.log('Processed activeUsersNow:', activeUsersNow)
    // Process historical data
    const historicalData =
      historicalResponse[0]?.rows?.map((row) => {
        const processedRow = {
          date: row.dimensionValues?.[0]?.value || '',
          users: parseInt(row.metricValues?.[0]?.value || '0', 10),
          views: parseInt(row.metricValues?.[1]?.value || '0', 10),
        }
        console.log('Processing row:', processedRow)
        return processedRow
      }) || []
    console.log('Processed historical data:', historicalData)
    // Calculate totals
    const total30DayUsers = historicalData.reduce((sum: number, row) => sum + row.users, 0)
    const total30DayViews = historicalData.reduce((sum: number, row) => sum + row.views, 0)
    console.log('Calculated totals:', {
      total30DayUsers,
      total30DayViews,
    })
    return {
      activeUsersNow,
      total30DayUsers,
      total30DayViews,
      historicalData,
    }
  } catch (error) {
    console.error('Error in getAnalyticsData:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      })
    }
    return {
      activeUsersNow: 0,
      total30DayUsers: 0,
      total30DayViews: 0,
      historicalData: [],
    }
  }
}
