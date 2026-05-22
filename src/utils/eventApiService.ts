import { apiService } from './apiService';

export interface Event {
  id: number;
  name: string;
  fromDate: string;
  toDate: string;
  location: string;
  shortDescription: string;
  longDescription?: string;
  imagePath?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface EventSection {
  title: string;
  events: Event[];
}

type EventBEModel = {
  Id?: number;
  Name?: string;
  FromDate?: string;
  ToDate?: string;
  Location?: string;
  ShortDescription?: string;
  LongDescription?: string | null;
  ImagePath?: string | null;
  IsActive?: boolean;
  IsDeleted?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string | null;
  id?: number;
  name?: string;
  fromDate?: string;
  toDate?: string;
  location?: string;
  shortDescription?: string;
  longDescription?: string | null;
  imagePath?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
};

type EventSectionResponse = EventBEModel[] | {
  title?: string;
  heading?: string;
  sectionTitle?: string;
  events?: EventBEModel[];
  data?: EventBEModel[];
  items?: EventBEModel[];
};

class EventApiService {
  // Get all active events (public endpoint)
  async getAllEvents(): Promise<Event[]> {
    const section = await this.getEventSection();
    return section.events;
  }

  // Get event section data, including API-managed heading when provided
  async getEventSection(): Promise<EventSection> {
    const response = await apiService.get<EventSectionResponse>('/Events/get-all');

    if (Array.isArray(response)) {
      return {
        title: '',
        events: response.map(this.mapEvent)
      };
    }

    return {
      title: response.sectionTitle || response.title || response.heading || '',
      events: (response.events || response.data || response.items || []).map(this.mapEvent)
    };
  }

  // Get event by id (public endpoint)
  async getEventById(id: number): Promise<Event> {
    const response = await apiService.get<EventBEModel>(`/Events/get/${id}`);
    return this.mapEvent(response);
  }

  private mapEvent(event: EventBEModel): Event {
    return {
      id: event.id ?? event.Id ?? 0,
      name: event.name ?? event.Name ?? '',
      fromDate: event.fromDate ?? event.FromDate ?? '',
      toDate: event.toDate ?? event.ToDate ?? '',
      location: event.location ?? event.Location ?? '',
      shortDescription: event.shortDescription ?? event.ShortDescription ?? '',
      longDescription: event.longDescription ?? event.LongDescription ?? undefined,
      imagePath: event.imagePath ?? event.ImagePath ?? undefined,
      isActive: event.isActive ?? event.IsActive ?? false,
      isDeleted: event.isDeleted ?? event.IsDeleted ?? false,
      createdAt: event.createdAt ?? event.CreatedAt ?? '',
      updatedAt: event.updatedAt ?? event.UpdatedAt ?? null
    };
  }
}

export const eventApiService = new EventApiService();
export default eventApiService;
