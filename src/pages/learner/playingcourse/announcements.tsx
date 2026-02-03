import { Bell, Calendar, User, BookOpen, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { announcementApiService, Announcement } from "../../../utils/announcementApiService";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";

interface AnnouncementsProps {
  courseId: string;
  loading?: boolean;
}

export default function Announcements({ courseId, loading = false }: AnnouncementsProps) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Load announcements when component mounts or courseId changes
  useEffect(() => {
    if (!courseId) {
      console.log('Announcements: No courseId available');
      setLoadingAnnouncements(false);
      return;
    }

    const loadAnnouncements = async () => {
      try {
        console.log('Announcements: Loading announcements for course:', courseId);
        setLoadingAnnouncements(true);
        setError(null);
        
        const courseIdNum = parseInt(courseId, 10);
        if (isNaN(courseIdNum)) {
          throw new Error('Invalid course ID');
        }
        
        const announcements = await announcementApiService.getCourseAnnouncements(courseIdNum);
        console.log('Announcements: Loaded announcements', announcements);
        setAnnouncements(announcements);
      } catch (err) {
        console.error('Announcements: Failed to load', err);
        setError(err instanceof Error ? err.message : 'Failed to load announcements');
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    loadAnnouncements();
  }, [courseId]);

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialogOpen(true);
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCourseTag = (announcement: Announcement) => {
    if (announcement.courseId) {
      return "Course Specific";
    }
    return "All Courses";
  };

  const getCourseTagColor = (announcement: Announcement) => {
    if (announcement.courseId) {
      return "bg-blue-100 text-blue-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  // Loading state
  if (loading || loadingAnnouncements) {
    return (
      <div className="container mx-auto px-2 py-2">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-500">Loading announcements...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-2 py-2">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-500 text-center">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-2">
      <div className="mb-6 flex items-center gap-3">
        <Bell className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold text-gray-800">Course Announcements</h2>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-center">No announcements yet</p>
          <p className="text-gray-400 text-sm text-center">
            Your instructor will post important updates and course information here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => handleViewAnnouncement(announcement)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Bell size={16} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>Instructor</span>
                      </div>
                      {(announcement.startDate || announcement.endDate) && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Calendar size={14} />
                          <span>
                            {announcement.startDate && announcement.endDate 
                              ? `${formatDate(announcement.startDate)} - ${formatDate(announcement.endDate)}`
                              : announcement.startDate 
                                ? `From ${formatDate(announcement.startDate)}`
                                : announcement.endDate 
                                  ? `Until ${formatDate(announcement.endDate)}`
                                  : ''
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCourseTagColor(announcement)}`}>
                    {getCourseTag(announcement)}
                  </span>
                </div>
              </div>
              
              <div className="text-gray-700 mb-3">
                <p className="line-clamp-3">
                  {announcement.message}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BookOpen size={14} />
                  <span>Click to read more</span>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Announcement Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {selectedAnnouncement?.title}
            </DialogTitle>
            <DialogDescription>
              Posted on {selectedAnnouncement && formatDate(selectedAnnouncement.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnnouncement && (
            <div className="py-4">
              <div className="mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCourseTagColor(selectedAnnouncement)}`}>
                  {getCourseTag(selectedAnnouncement)}
                </span>
              </div>
              
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedAnnouncement.message}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
