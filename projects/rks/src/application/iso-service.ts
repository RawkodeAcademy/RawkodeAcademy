import { appendIsoPart, createIsoManifest, createIsoPart, finalizeIsoManifest } from '../domain/iso-domain';
import type { IsoManifest, IsoPart } from '../domain/types';
import type { IsoManifestRepository, IsoPartRepository } from './ports';

export class IsoRecordingService {
  constructor(
    private readonly manifests: IsoManifestRepository,
    private readonly parts: IsoPartRepository,
  ) {}

  async init(draft: Parameters<typeof createIsoManifest>[0]): Promise<IsoManifest> {
    const manifest = createIsoManifest(draft);
    await this.manifests.save(manifest);
    return manifest;
  }

  async append(manifestId: string, partNo: number, bytes: number, hash: string): Promise<IsoManifest> {
    const manifest = await this.require(manifestId);
    const updated = appendIsoPart(manifest, partNo, bytes, hash);
    await this.parts.save(createIsoPart(manifest, partNo, bytes, hash));
    await this.manifests.update(updated);
    return updated;
  }

  async complete(manifestId: string, hash: string): Promise<IsoManifest> {
    const manifest = await this.require(manifestId);
    const updated = finalizeIsoManifest(manifest, 'COMPLETE', hash);
    await this.manifests.update(updated);
    return updated;
  }

  async abort(manifestId: string): Promise<IsoManifest> {
    const manifest = await this.require(manifestId);
    const updated = finalizeIsoManifest(manifest, 'FAILED', manifest.hash);
    await this.manifests.update(updated);
    return updated;
  }

  async partsFor(manifestId: string): Promise<IsoPart[]> {
    return this.parts.listByManifest(manifestId);
  }

  private async require(id: string): Promise<IsoManifest> {
    const manifest = await this.manifests.findById(id);
    if (!manifest) {
      throw new Error(`ISO manifest ${id} not found`);
    }
    return manifest;
  }
}
