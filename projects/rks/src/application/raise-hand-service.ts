import { acceptRaiseHand, createRaiseHand, rejectRaiseHand } from '../domain/raise-hand-domain';
import type { RaiseHandRequest } from '../domain/types';
import type { RaiseHandRepository } from './ports';

export class RaiseHandService {
  constructor(private readonly repository: RaiseHandRepository) {}

  async create(draft: Parameters<typeof createRaiseHand>[0]): Promise<RaiseHandRequest> {
    const request = createRaiseHand(draft);
    await this.repository.save(request);
    return request;
  }

  async accept(id: string, showId: string): Promise<RaiseHandRequest> {
    const request = await this.require(id, showId);
    const updated = acceptRaiseHand(request);
    await this.repository.update(updated);
    return updated;
  }

  async reject(id: string, showId: string): Promise<RaiseHandRequest> {
    const request = await this.require(id, showId);
    const updated = rejectRaiseHand(request);
    await this.repository.update(updated);
    return updated;
  }

  async list(showId: string): Promise<RaiseHandRequest[]> {
    return this.repository.listByShow(showId);
  }

  private async require(id: string, showId: string): Promise<RaiseHandRequest> {
    const requests = await this.repository.listByShow(showId);
    const request = requests.find((item) => item.id === id);
    if (!request) {
      throw new Error(`Raise-hand request ${id} not found`);
    }
    return request;
  }
}
