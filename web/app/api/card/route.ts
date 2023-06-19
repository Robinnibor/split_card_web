import { NextResponse } from 'next/server'
 
export async function POST(req: Request) {
// Get the base URL from environment or use a default value
const defaultServer = "http://127.0.0.1";
const serverUrl = new URL(process.env.IMAGE_PROCESSING_SERVER || defaultServer);

// Get the port from environment or use a default value
const port = process.env.PORT || '5000';

// Construct the complete URL
const completeUrl = new URL(serverUrl);
completeUrl.port = port;
  const json = await req.json();
  const res = await fetch(completeUrl.toString() + '/get_cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(json),
  })
 
  const data = await res.json()
 
  return NextResponse.json(data)
}
