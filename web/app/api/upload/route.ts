import axios from 'axios'
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
  const formData = await req.formData()
  const { data } = await axios.post(completeUrl.toString() + 'upload_image', formData)

  return NextResponse.json(data)
}
