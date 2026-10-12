import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { namesForPullRequest, pullRequestIdentity, WORKERS_DEV_SUBDOMAIN } from '../../../payload/scripts/pr-preview-resources.mjs'
import { WEBSITE_PREVIEW_CONTENT_SOURCE } from '../../../payload/scripts/website-preview-source.mjs'

export function assertPreviewVerification(value, identity) {
  const names = namesForPullRequest(identity.pullRequestNumber, identity.sha)
  if (value?.websiteSha !== identity.sha || value?.pullRequestNumber !== identity.pullRequestNumber || value?.readOnly !== true) {
    throw new Error('No verified read-only website preview exists for this PR/head SHA.')
  }
  const source = WEBSITE_PREVIEW_CONTENT_SOURCE
  if (value.contentSource?.workerName !== source.workerName || value.contentSource?.sha !== source.sha || value.contentSource?.entrypoint !== source.entrypoint) {
    throw new Error('The verified website preview used an unexpected public content source.')
  }
  const url = new URL(value.previewUrl)
  const suffix = `-${names.websiteWorkerName}.${WORKERS_DEV_SUBDOMAIN}.workers.dev`
  if (url.protocol !== 'https:' || !url.hostname.endsWith(suffix) || !/^[a-f0-9]{8}$/.test(url.hostname.slice(0, -suffix.length)) || url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('The verified preview URL is not the isolated website version preview.')
  }
  return url.href
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const value = JSON.parse(await readFile('dist/server/website-preview-verification.json', 'utf8'))
  console.log(`Verified read-only website preview: ${assertPreviewVerification(value, pullRequestIdentity())}`)
}
