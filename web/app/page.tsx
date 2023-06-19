import { createAccessToken } from "@/lib/accessToken";
import CardAnalyzer from "./CardAnalyzer";

export default async function Home() {
  const getUrls = async () => {
    return {
      nyckel: process.env.NEXT_PUBLIC_NYCKEL_URL || 'https://www.nyckel.com',
      imageProcessingServer: `${process.env.NEXT_PUBLIC_IMAGE_PROCESSING_SERVER_ORIGIN}${process.env.NEXT_PUBLIC_IMAGE_PROCESSING_SERVER_PORT ? ':' + process.env.NEXT_PUBLIC_IMAGE_PROCESSING_SERVER_PORT : ''}`
    };
  };
  const token = await createAccessToken();
  const urls = await getUrls();
  const props = { token, urls };
  
  return (
    <CardAnalyzer {...props} />
  )
}
