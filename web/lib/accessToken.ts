import 'server-only'

export type NyckelToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const createAccessToken: () => Promise<NyckelToken> = async () => {
  const res = await fetch(process.env.NEXT_PUBLIC_NYCKEL_URL + '/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `client_id=${process.env.NYCKEL_CLIENT_ID}&client_secret=${process.env.NYCKEL_CLIENT_SECRET}&grant_type=client_credentials`,
    cache: 'no-cache',
  })

  return res.json();
}
