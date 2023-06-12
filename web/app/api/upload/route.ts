import axios from 'axios'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const formData = await req.formData()
  const { data } = await axios.post(process.env.IMAGE_PROCESSING_SERVER_URL + '/upload_image', formData)

  return NextResponse.json(data)
}
