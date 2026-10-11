import { parse } from 'node-html-parser'

/** Read rendered media attributes with the same entity decoding as a browser.
 * The caller still validates origin, checksums, widths, and fetched bytes.
 */
export function cmsMediaReferences(html, baseUrl) {
  const references = []
  for (const element of parse(html).querySelectorAll('img[src], a[href]')) {
    const value = element.getAttribute('src') ?? element.getAttribute('href')
    try { references.push(new URL(value, baseUrl)) } catch { /* Ignore unrelated malformed links. */ }
  }
  return {
    diagramUrl: references.find(url => /^\/cms-diagrams\/[a-f0-9]{64}\.svg$/i.test(url.pathname)),
    assetUrl: references.find(url => /^\/cms-assets\/[A-Za-z0-9_-]{8,128}$/.test(url.pathname)),
  }
}
