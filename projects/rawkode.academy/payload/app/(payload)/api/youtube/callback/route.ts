import config from '@payload-config'
import { getPayload } from 'payload'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { type ConnectEnv, finishConnect } from '../../../../../src/youtube/connect'

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true })
  return finishConnect(request, await getPayload({ config }), env as unknown as ConnectEnv)
}
