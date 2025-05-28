import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const appUserId = searchParams.get('app_user_id')

  if (!appUserId) {
    return NextResponse.json({ error: 'Missing app_user_id' }, { status: 400 })
  }

  try {
    console.log('RevenueCat key prefix:', process.env.REVENUECAT_SECRET_KEY?.slice(0, 8));
    console.log('Fetching user:', appUserId);
    const response = await fetch(`https://api.revenuecat.com/v2/subscribers/${appUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.REVENUECAT_SECRET_KEY}`,
        'Accept': 'application/json',
      },
      credentials: 'include'
    })

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: await response.text() };
      }
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
} 