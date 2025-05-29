// src/routes/analytics.ts
import { google } from 'googleapis'
import type { NextApiRequest, NextApiResponse } from 'next'

const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly']
const KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_JSON // update path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: SCOPES,
    })
    const authClient = (await auth.getClient()) as any
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth: authClient,
    })
    const response = await analyticsData.properties.runReport({
      property: `properties/486270273`,
      requestBody: {
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }],
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      },
    })
    res.status(200).json(response.data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Analytics error' })
  }
}
