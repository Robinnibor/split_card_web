import { createAccessToken } from "@/lib/accessToken";
import CardAnalyzer from "./CardAnalyzer";

export default async function Home() {
  const token = await createAccessToken();

  return (
    <CardAnalyzer {...token} />
  )
}
