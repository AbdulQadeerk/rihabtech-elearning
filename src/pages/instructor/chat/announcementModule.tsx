import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Trash2, Edit, Plus } from 'lucide-react';
import { firebaseAnnouncementsService, Announcement as FirebaseAnnouncement } from '../../../utils/firebaseAnnouncements';
import { firebaseLearningRemindersService } from '../../../utils/firebaseLearningReminders';
import { useAuth } from '../../../context/AuthContext';

// Types
export type Announcement = {
  id: string;
  title: string;
  message: string;
  courseId: string | 'all';
  startDate?: string; // ISO
  endDate?: string; // ISO
  createdAt: string; // ISO
};

export type Course = {
  id: string;
  title: string;
};

// Static mock data
const MOCK_COURSES: Course[] = [
  { id: 'all-courses', title: 'All Courses' },
  { id: 'course-1', title: 'React Fundamentals' },
  { id: 'course-2', title: 'Advanced TypeScript' },
  { id: 'course-3', title: 'Node.js for Beginners' },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: 'Welcome to the course!',
    message: 'Hello learners — welcome. Please check the syllabus and introduce yourself in the forum.',
    courseId: 'course-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a2',
    title: 'Maintenance downtime',
    message: 'Platform will be under maintenance on Saturday 10 PM - 11 PM.',
    courseId: 'all',
    createdAt: new Date().toISOString(),
  }
];

// Helpers
const uid = () => Math.random().toString(36).slice(2, 9);

export default function AnnouncementModule() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  // Get instructor ID
  const instructorId = user?.email || user?.UserName || user?.uid;

  // Load courses from Firebase
  useEffect(() => {
    if (!instructorId) {
      setLoadingCourses(false);
      return;
    }

    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const availableCourses = await firebaseLearningRemindersService.getAvailableCourses(instructorId, instructorId);
        
        // Convert to local Course format and add "All Courses" option
        const localCourses: Course[] = [
          { id: 'all', title: 'All Courses' },
          ...availableCourses.map(course => ({
            id: course.id,
            title: course.title
          }))
        ];
        
        setCourses(localCourses);
      } catch (err) {
        console.error('Error loading courses:', err);
        // Fallback to mock courses
        setCourses(MOCK_COURSES);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [instructorId]);

  // Load announcements from Firebase
  useEffect(() => {
    if (!instructorId) {
      setLoading(false);
      return;
    }

    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);
        const firebaseAnnouncements = await firebaseAnnouncementsService.getInstructorAnnouncements(instructorId);
        
        // Convert Firebase announcements to local format
        const localAnnouncements: Announcement[] = firebaseAnnouncements.map(ann => ({
          id: ann.id,
          title: ann.title,
          message: ann.message,
          courseId: ann.courseId || 'all',
          startDate: ann.startDate?.toISOString(),
          endDate: ann.endDate?.toISOString(),
          createdAt: ann.createdAt.toISOString()
        }));
        
        setAnnouncements(localAnnouncements);
      } catch (err) {
        console.error('Error loading announcements:', err);
        setError('Failed to load announcements');
        // Fallback to mock data
        setAnnouncements(MOCK_ANNOUNCEMENTS);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, [instructorId]);

  const filtered = useMemo(() => {
    if (filterCourse === 'all') return announcements.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return announcements.filter(a => a.courseId === filterCourse).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [filterCourse, announcements]);

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (ann: Announcement) => {
    setEditing(ann);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    
    try {
      await firebaseAnnouncementsService.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement');
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterCourse} onValueChange={(v) => setFilterCourse(v)} disabled={loadingCourses}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={loadingCourses ? "Loading courses..." : "All courses"} />
            </SelectTrigger>
            <SelectContent>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => setFilterCourse('all')} disabled={loadingCourses}>Reset</Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={openCreate} disabled={loading || loadingCourses}>
            <Plus size={14} />
            <span className="ml-2">New Announcement</span>
          </Button>
        </div>
      </div>

      {loadingCourses && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Loading courses...</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Loading announcements...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {!loading && !loadingCourses && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="p-4 bg-white rounded shadow text-sm text-gray-600">No announcements for selected course.</div>
          )}

          {filtered.map(a => (
            <div key={a.id} className="p-3 bg-white rounded shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{a.title}</h3>
                <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</span>
                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">{a.courseId === 'all' ? 'All Courses' : courses.find(c => c.id === a.courseId)?.title}</span>
                {(a.startDate || a.endDate) && (
                  <span className="text-xs text-blue-600">
                    {a.startDate && a.endDate 
                      ? `${new Date(a.startDate).toLocaleDateString()} - ${new Date(a.endDate).toLocaleDateString()}`
                      : a.startDate 
                        ? `From ${new Date(a.startDate).toLocaleDateString()}`
                        : a.endDate 
                          ? `Until ${new Date(a.endDate).toLocaleDateString()}`
                          : ''
                    }
                  </span>
                )}
              </div>
                <p className="text-sm text-gray-700 mt-2 break-words">{a.message}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => openEdit(a)} title="Edit">
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(a.id)} title="Delete">
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnnouncementModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courses={courses}
        initial={editing}
        onSave={async (payload) => {
          if (!instructorId) {
            alert('User not authenticated');
            return;
          }

          try {
            if (editing) {
              // Update existing announcement
              await firebaseAnnouncementsService.updateAnnouncement(editing.id, {
                title: payload.title,
                message: payload.message,
                courseId: payload.courseId === 'all' ? undefined : payload.courseId,
                startDate: payload.startDate ? new Date(payload.startDate) : undefined,
                endDate: payload.endDate ? new Date(payload.endDate) : undefined
              });
              
              setAnnouncements(prev => prev.map(p => p.id === editing.id ? { ...p, ...payload } : p));
            } else {
              // Create new announcement
              const announcementId = await firebaseAnnouncementsService.createAnnouncement({
                title: payload.title,
                message: payload.message,
                courseId: payload.courseId === 'all' ? undefined : payload.courseId,
                instructorId: instructorId,
                startDate: payload.startDate ? new Date(payload.startDate) : undefined,
                endDate: payload.endDate ? new Date(payload.endDate) : undefined
              });
              
              const newAnn: Announcement = { 
                id: announcementId, 
                ...payload, 
                createdAt: new Date().toISOString() 
              };
              setAnnouncements(prev => [newAnn, ...prev]);
            }
            setIsModalOpen(false);
          } catch (err) {
            console.error('Error saving announcement:', err);
            alert('Failed to save announcement');
          }
        }}
      />
    </div>
  );
}

function AnnouncementModal({ open, onClose, courses, initial, onSave }: {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  initial?: Announcement | null;
  onSave: (payload: Omit<Announcement, 'id' | 'createdAt'>) => void;
}){
  const [title, setTitle] = useState(initial?.title || '');
  const [message, setMessage] = useState(initial?.message || '');
  const [courseId, setCourseId] = useState<string>(initial?.courseId || 'all');
  const [startDate, setStartDate] = useState(initial?.startDate ? initial.startDate.split('T')[0] : '');
  const [endDate, setEndDate] = useState(initial?.endDate ? initial.endDate.split('T')[0] : '');

  // Sync when initial changes
  React.useEffect(() => {
    setTitle(initial?.title || '');
    setMessage(initial?.message || '');
    setCourseId(initial?.courseId || 'all');
    setStartDate(initial?.startDate ? initial.startDate.split('T')[0] : '');
    setEndDate(initial?.endDate ? initial.endDate.split('T')[0] : '');
  }, [initial]);

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) {
      alert('Please provide title and message');
      return;
    }

    // Validate dates if provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date');
      return;
    }

    onSave({ 
      title: title.trim(), 
      message: message.trim(), 
      courseId,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />

          <label className="text-sm font-medium">Message</label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} />

          <label className="text-sm font-medium">Course</label>
          <Select value={courseId} onValueChange={(v) => setCourseId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date (Optional)</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="When to show announcement"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date (Optional)</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="When to hide announcement"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>{initial ? 'Save' : 'Create'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
