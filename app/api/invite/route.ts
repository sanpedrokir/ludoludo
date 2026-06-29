import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { to, inviterName, roomCode, roomId } = await request.json()

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromPhone = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromPhone) {
    return NextResponse.json({ error: 'SMS not configured' }, { status: 503 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ludoludo.app'
  const joinLink = `${appUrl}/join?code=${roomCode}&room=${roomId}`
  const message = `${inviterName} invited you to play LudoLudo! Game code: ${roomCode}. Join here: ${joinLink}`

  const body = new URLSearchParams({
    To: to,
    From: fromPhone,
    Body: message,
  })

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    return NextResponse.json({ error: err.message }, { status: response.status })
  }

  return NextResponse.json({ success: true })
}
