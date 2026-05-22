import { Clock, MapPin, } from "lucide-react";
import Divider from "../../../components/ui/divider";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { eventApiService, Event } from "../../../utils/eventApiService";

export default function NewCourses() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sectionTitle, setSectionTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await eventApiService.getEventSection();
        setSectionTitle(data.title);
        // Limit to 3 events as per the design
        setEvents(data.events.slice(0, 3));
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Helper to format date range
  const formatTime = (fromDate: string, toDate: string) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const formatOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${from.toLocaleTimeString([], formatOptions)} - ${to.toLocaleTimeString([], formatOptions)}`;
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-8">
        <div className="flex justify-between items-center mb-8">
          {sectionTitle && <h2 className="section-title">{sectionTitle}</h2>}
          <Button variant={'outline'} className="px-6 py-3 rounded-none border-black h-auto text-black hover:bg-primary font-medium" onClick={() => {
            window.location.href = '/#/courselist';
          }}>
            View all Events
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {events.map((event, index) => (
            <div key={index} className="overflow-hidden cursor-pointer hover:opacity-50" onClick={() => {
              window.location.href = `/#/eventDetails?id=${event.id}`;
            }}>
              <div className="relative">
                <img src={event.imagePath || "/Images/courses/event 7.png"} alt={event.name} className="w-full h-45 object-cover" />
              </div>
              <div className="py-4 flex flex-col gap-2">
                <h3 className="text-[#000927] text-lg font-bold font-['Archivo'] capitalize leading-normal mb-2">{event.name}</h3>
                <div className="flex gap-3 items-center text-[#666666] text-sm font-normal font-['Barlow'] leading-snug">
                  <div className=" px-1 py-0.5 flex gap-2 items-center">
                    <Clock size={16} />
                    <span>{formatTime(event.fromDate, event.toDate)}</span>
                  </div>
                  <Divider />
                  <div className="px-1 py-0.5 flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{event.location}</span>
                  </div>
                </div>
                <p className=" text-[#666666] text-base font-normal font-['Barlow'] leading-relaxed max-lines-2">{event.shortDescription}</p>
                <a className="text-primary font-medium">Read More</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
