import { NextResponse } from 'next/server'
 
export async function POST(req: Request) {
  const json = await req.json();
  const res = await fetch(process.env.IMAGE_PROCESSING_SERVER_URL + '/get_cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(json),
  })
 
  const data = await res.json()
 
  return NextResponse.json(data)
}
