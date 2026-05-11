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
}

class EventApiService {
  // Get all active events (public endpoint)
  async getAllEvents(): Promise<Event[]> {
    return apiService.get<Event[]>('/Events/get-all');
  }

  // Get event by id (public endpoint)
  async getEventById(id: number): Promise<Event> {
    return apiService.get<Event>(`/Events/get/${id}`);
  }
}

export const eventApiService = new EventApiService();
export default eventApiService;
