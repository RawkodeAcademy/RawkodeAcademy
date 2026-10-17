import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'
import { isStaff } from '../auth/access'
import { type AdminAccess } from '../admin/access'
import { applyPreset } from '../admin/collection-admin'
import { fieldComponents } from '../admin/config'

// Set only by the connect callback (context.youtubeConnect).
export const connectionFields = ['youtubeChannelId', 'youtubeTitle', 'streamId', 'connection', 'connectedAt'] as const

const serverOwned: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (req.context.youtubeConnect === true) return data
  for (const field of connectionFields) {
    if (field in data && JSON.stringify(data[field]) !== JSON.stringify(originalDoc?.[field] ?? null)) {
      throw new Error(`${field} is set by connecting the channel to YouTube`)
    }
  }
  return data
}

const staff = ({ req }: { req: { user?: unknown } }) => isStaff(req.user)
const readOnly = (description: string) => ({ readOnly: true, description })

export const channelsCollection = (access: AdminAccess): CollectionConfig => applyPreset({
  slug: 'channels',
  access: { read: staff, create: staff, update: staff, delete: staff },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'privacy', type: 'select', options: ['public', 'unlisted', 'private'], defaultValue: 'public', required: true,
      admin: { description: 'Privacy for broadcasts the CMS creates on this channel.' } },
    { name: 'connect', type: 'ui', admin: { components: { Field: fieldComponents.channelConnect } } },
    { name: 'connection', type: 'select', options: ['disconnected', 'connected'], defaultValue: 'disconnected', required: true, admin: readOnly('Set by Connect YouTube.') },
    { name: 'youtubeChannelId', type: 'text', unique: true, admin: readOnly('The YouTube channel this record publishes to. Fixed once connected.') },
    { name: 'youtubeTitle', type: 'text', admin: readOnly('Channel title reported by YouTube.') },
    { name: 'streamId', type: 'text', admin: readOnly('Reusable stream every scheduled broadcast binds to. Its stream key is in YouTube Studio.') },
    { name: 'connectedAt', type: 'date', admin: readOnly('When the channel was last connected.') },
  ],
  hooks: { beforeChange: [serverOwned] },
}, access)

// Added to videos: which channels a published video syncs to, and its status.
export const videoChannelFields: Field[] = [
  { name: 'channels', type: 'relationship', relationTo: 'channels' as never, hasMany: true,
    admin: { description: 'Publishing with a channel selected schedules or updates the video there. The CMS then owns its title, description and tags on YouTube.' } },
  { name: 'youtubeStatus', type: 'ui', admin: { components: { Field: fieldComponents.youtubeStatus }, condition: data => Boolean(data?.id) } },
]
