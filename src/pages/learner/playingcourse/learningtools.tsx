import { Play, Plus, Clock, Calendar, Trash2, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import LearningReminderDialog from "./learningReminderDialog";
import { learningReminderApiService, LearningReminder } from "../../../utils/learningReminderApiService";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";

interface LearningToolsProps {
  courseId?: string;
  instructorId?: string;
}

export default function LearningTools({ courseId, instructorId }: LearningToolsProps) {
  const { user } = useAuth();
  const [isOpenAddDialog, setIsOpenAddDialog] = useState(false);
  const [reminders, setReminders] = useState<LearningReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReminder, setEditingReminder] = useState<LearningReminder | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<LearningReminder | null>(null);

  // Load reminders when component mounts
  useEffect(() => {
    if (!user) {
      console.log('Learning Tools: No user available');
      setLoading(false);
      return;
    }

    const loadReminders = async () => {
      try {
        console.log('Learning Tools: Loading reminders');
        setLoading(true);
        setError(null);
        
        const reminders = await learningReminderApiService.getUserReminders();
        console.log('Learning Tools: Loaded reminders', reminders);
        setReminders(reminders);
      } catch (err) {
        console.error('Learning Tools: Failed to load', err);
        setError(err instanceof Error ? err.message : 'Failed to load reminders');
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, [user]);

  const handleCreateReminder = async (reminderData: any) => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    try {
      setError(null);
      console.log('Creating/updating reminder with data:', reminderData);
      
      // Extract course ID from the selected content
      let selectedCourseId: number | undefined = undefined;
      if (reminderData.attachedContent !== 'none' && reminderData.attachedContent.startsWith('course-')) {
        const courseIdStr = reminderData.attachedContent.replace('course-', '');
        selectedCourseId = parseInt(courseIdStr, 10);
        if (isNaN(selectedCourseId)) {
          selectedCourseId = undefined;
        }
      } else if (courseId) {
        selectedCourseId = parseInt(courseId, 10);
        if (isNaN(selectedCourseId)) {
          selectedCourseId = undefined;
        }
      }

      if (editingReminder) {
        // Update existing reminder
        console.log('Updating existing reminder:', editingReminder.id);
        await learningReminderApiService.updateReminder(editingReminder.id, {
          courseId: selectedCourseId,
          name: reminderData.name,
          frequency: reminderData.frequency,
          time: reminderData.time,
          selectedDays: reminderData.selectedDays,
          isActive: true
        });
        console.log('Reminder updated successfully');
        
        // Reload reminders
        const reminders = await learningReminderApiService.getUserReminders();
        setReminders(reminders);
        setEditingReminder(null);
        setIsOpenAddDialog(false);
      } else {
        // Create new reminder
        await learningReminderApiService.createReminder({
          courseId: selectedCourseId,
          name: reminderData.name,
          frequency: reminderData.frequency,
          time: reminderData.time,
          selectedDays: reminderData.selectedDays,
          isActive: true
        });
        console.log('Reminder created successfully');
        
        // Reload reminders
        const reminders = await learningReminderApiService.getUserReminders();
        setReminders(reminders);
        setIsOpenAddDialog(false);
      }
    } catch (err) {
      console.error("Error creating/updating reminder:", err);
      setError(`Failed to ${editingReminder ? 'update' : 'create'} reminder: ${(err as any)?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteReminder = (reminder: LearningReminder) => {
    setReminderToDelete(reminder);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteReminder = async () => {
    if (!reminderToDelete) return;

    try {
      setError(null);
      await learningReminderApiService.deleteReminder(reminderToDelete.id);
      setDeleteConfirmOpen(false);
      setReminderToDelete(null);
      console.log('Reminder deleted successfully');
      
      // Reload reminders
      const reminders = await learningReminderApiService.getUserReminders();
      setReminders(reminders);
    } catch (err) {
      console.error("Error deleting reminder:", err);
      setError(`Failed to delete reminder: ${(err as any)?.message || 'Unknown error'}`);
    }
  };

  const handleEditReminder = (reminder: LearningReminder) => {
    setEditingReminder(reminder);
    setIsOpenAddDialog(true);
  };

  const formatReminderTime = (reminder: LearningReminder) => {
    const frequencyText = reminder.frequency === 'daily' ? 'Daily' : 
                         reminder.frequency === 'weekly' ? 'Weekly' : 'Once';
    
    if (reminder.frequency === 'weekly' && reminder.selectedDays && reminder.selectedDays.length > 0) {
      const dayNames = {
        'Su': 'Sun', 'Mo': 'Mon', 'Tu': 'Tue', 'We': 'Wed', 
        'Th': 'Thu', 'Fr': 'Fri', 'Sa': 'Sat'
      };
      const selectedDayNames = reminder.selectedDays.map(day => dayNames[day as keyof typeof dayNames] || day);
      return `${frequencyText} (${selectedDayNames.join(', ')}) at ${reminder.time}`;
    }
    
    return `${frequencyText} at ${reminder.time}`;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-2 py-2">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-gray-500 text-center">Please log in to view and create learning reminders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-2">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Learning Tools</h2>
        <Button 
          onClick={() => {
            setEditingReminder(null);
            setIsOpenAddDialog(true);
          }} 
          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded flex items-center font-medium"
        >
          <Plus size={16} className="mr-2" />
          <span>Add a learning Reminder</span>
        </Button>
        <LearningReminderDialog 
          isOpen={isOpenAddDialog} 
          setIsOpen={(open) => {
            setIsOpenAddDialog(open);
            if (!open) {
              setEditingReminder(null);
            }
          }}
          onSave={handleCreateReminder}
          editingReminder={editingReminder}
          courseId={courseId}
          instructorId={instructorId}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading reminders...</div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Clock size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-center">No learning reminders yet. Create your first reminder to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start flex-1">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mr-3 mt-1">
                    <Clock size={14} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] text-[#000927] font-semibold font-['Poppins'] leading-relaxed mb-2">
                      {reminder.name}
                    </h3>
                    <p className="text-[#181818] text-base font-normal font-['Kumbh_Sans'] leading-relaxed mb-2">
                      {formatReminderTime(reminder)}
                    </p>
                    {reminder.courseId && (
                      <p className="text-sm text-gray-500 mb-2">
                        <Calendar size={12} className="inline mr-1" />
                        Attached to course
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Created: {new Date(reminder.createdAt).toLocaleDateString()} at {new Date(reminder.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditReminder(reminder)}
                    className="text-gray-500 hover:text-primary"
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReminder(reminder)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Learning Reminder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this learning reminder? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {reminderToDelete && (
            <div className="py-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-sm text-gray-900 mb-1">{reminderToDelete.name}</h4>
                <p className="text-sm text-gray-600">
                  {formatReminderTime(reminderToDelete)}
                </p>
                {reminderToDelete.courseId && (
                  <p className="text-xs text-gray-500 mt-1">
                    <Calendar size={12} className="inline mr-1" />
                    Attached to course
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setReminderToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteReminder}
            >
              Delete Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}