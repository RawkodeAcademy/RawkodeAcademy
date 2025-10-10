import type { Show } from '../domain/types';
import { createShow, endShow, scheduleShow, startShow } from '../domain/show-domain';
import type { ShowRepository } from './ports';

export class ShowService {
  constructor(private readonly shows: ShowRepository) {}

  async create(draft: Parameters<typeof createShow>[0]): Promise<Show> {
    const show = createShow(draft);
    await this.shows.save(show);
    return show;
  }

  async schedule(id: string, startsAt: Date): Promise<Show> {
    const show = await this.require(id);
    const updated = scheduleShow(show, startsAt);
    await this.shows.save(updated);
    return updated;
  }

  async start(id: string): Promise<Show> {
    const show = await this.require(id);
    const updated = startShow(show);
    await this.shows.save(updated);
    return updated;
  }

  async end(id: string): Promise<Show> {
    const show = await this.require(id);
    const updated = endShow(show);
    await this.shows.save(updated);
    return updated;
  }

  async list(): Promise<Show[]> {
    return this.shows.list();
  }

  private async require(id: string): Promise<Show> {
    const show = await this.shows.findById(id);
    if (!show) {
      throw new Error(`Show ${id} not found`);
    }
    return show;
  }
}
