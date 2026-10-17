import config from '@payload-config'
import { getPayload } from 'payload'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { beginConnect, type ConnectEnv } from '../../../../../src/youtube/connect'

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true })
  return beginConnect(request, await getPayload({ config }), env as unknown as ConnectEnv)
}
