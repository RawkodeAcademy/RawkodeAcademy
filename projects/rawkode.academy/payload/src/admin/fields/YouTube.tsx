import type { UIFieldServerProps } from 'payload'
import { isStaff } from '../../auth/access'
import { cloudflare } from '../../cloudflare'
import { YouTubeStore } from '../../youtube/store'
import { timeAgo } from '../format'

// Channel edit view: start (or redo) the Google consent for this channel.
export async function ChannelConnect({ id, data, req }: UIFieldServerProps) {
	if (!isStaff(req.user)) return null
	if (id === undefined) return <p className="academy-panel__text">Save the channel, then connect it to YouTube.</p>
	const connected = (data as { connection?: string } | undefined)?.connection === 'connected'
	return (
		<div className="academy-panel">
			<p className="academy-panel__text">
				{connected
					? 'Connected. Reconnect if YouTube access was revoked or the stream key changed.'
					: 'Sign in with the Google account that owns this YouTube channel. The CMS keeps a sealed refresh token and only ever writes to this channel.'}
			</p>
			<div className="academy-panel__actions">
				<a href={`/api/youtube/connect?channel=${encodeURIComponent(String(id))}`}>{connected ? 'Reconnect YouTube' : 'Connect YouTube'}</a>
			</div>
		</div>
	)
}

const labels: Record<string, string> = { scheduled: 'Scheduled', synced: 'In sync', error: 'Failed', unsupported: 'Not synced' }

// Video edit view: per-channel sync status written by the sync workflow.
export async function YouTubeStatus({ id, req }: UIFieldServerProps) {
	if (!isStaff(req.user) || id === undefined) return null
	let rows: [string, Awaited<ReturnType<YouTubeStore['syncState']>>[string]][] = []
	try {
		rows = Object.entries(await new YouTubeStore(cloudflare.env.D1).syncState(Number(id)))
	} catch (error) {
		console.error(JSON.stringify({ level: 'error', message: 'youtube status failed', error: String(error) }))
		return <p className="academy-widget__error">YouTube status is unavailable right now.</p>
	}
	if (!rows.length) return <p className="academy-panel__text">Not synced to YouTube. Select a channel and publish.</p>
	return (
		<table className="academy-table academy-table--compact">
			<caption>YouTube sync</caption>
			<thead>
				<tr>
					<th scope="col">Channel</th>
					<th scope="col">Status</th>
					<th scope="col">Video</th>
					<th scope="col">Updated</th>
				</tr>
			</thead>
			<tbody>
				{rows.map(([channel, state]) => (
					<tr key={channel}>
						<td>{channel}</td>
						<td title={state.message}>
							{labels[state.state ?? ''] ?? 'Pending'}
							{state.message ? <span className="academy-muted"> · {state.message}</span> : null}
						</td>
						<td>
							{state.youtubeVideoId ? (
								<a href={`https://studio.youtube.com/video/${encodeURIComponent(state.youtubeVideoId)}/edit`} target="_blank" rel="noopener noreferrer">
									{state.youtubeVideoId}
									<span className="academy-visually-hidden"> (opens YouTube Studio in a new tab)</span>
								</a>
							) : (
								<span className="academy-muted">None yet</span>
							)}
						</td>
						<td>{state.syncedAt ? timeAgo(state.syncedAt) : ''}</td>
					</tr>
				))}
			</tbody>
		</table>
	)
}
