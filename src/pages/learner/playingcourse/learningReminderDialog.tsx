import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Clock } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { firebaseLearningRemindersService, CourseOption } from '../../../utils/firebaseLearningReminders';
import { useAuth } from '../../../context/AuthContext';

interface LearningReminderDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave?: (reminderData: any) => void;
  editingReminder?: any;
  courseId?: string;
  instructorId?: string;
}

const LearningReminderDialog = ({ isOpen, setIsOpen, onSave, editingReminder, courseId, instructorId }: LearningReminderDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: 'Learning reminder',
    attachedContent: 'none',
    frequency: 'daily',
    time: '12:00 PM',
    selectedDays: []
  });
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const days: { short: string; full: string }[] = [
    { short: 'Su', full: 'Sunday' },
    { short: 'Mo', full: 'Monday' },
    { short: 'Tu', full: 'Tuesday' },
    { short: 'We', full: 'Wednesday' },
    { short: 'Th', full: 'Thursday' },
    { short: 'Fr', full: 'Friday' },
    { short: 'Sa', full: 'Saturday' }
  ];

  // Load courses when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen]);

  // Initialize form data when editing
  useEffect(() => {
    if (editingReminder) {
      setFormData({
        name: editingReminder.name || 'Learning reminder',
        attachedContent: editingReminder.courseId ? `course-${editingReminder.courseId}` : 'none',
        frequency: editingReminder.frequency || 'daily',
        time: editingReminder.time || '12:00 PM',
        selectedDays: editingReminder.selectedDays || []
      });
    } else {
      setFormData({
        name: 'Learning reminder',
        attachedContent: 'none',
        frequency: 'daily',
        time: '12:00 PM',
        selectedDays: []
      });
    }
  }, [editingReminder]);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      console.log('Loading courses for user:', user?.email || user?.UserName || user?.uid);
      
      // Get user ID - prioritize email since that's what's stored in Firebase
      const userId = user?.email || user?.UserName || user?.uid;
      
      if (!userId) {
        console.log('No user ID available, using fallback courses');
        setCourses([
          { id: '1', title: 'Course: The Python Developer Essentials Immersive Bootcamp', instructorId: instructorId || 'instructor1' },
          { id: '2', title: 'Course: React JS Frontend Web Development for Beginners', instructorId: instructorId || 'instructor2' },
          { id: '3', title: 'Course: Introduction To Python Programming', instructorId: instructorId || 'instructor3' }
        ]);
        return;
      }

      const availableCourses = await firebaseLearningRemindersService.getAvailableCourses(userId, instructorId);
      console.log('Loaded courses from Firebase:', availableCourses);
      
      if (availableCourses.length === 0) {
        console.log('No courses found, using fallback courses');
        setCourses([
          { id: '1', title: 'Course: The Python Developer Essentials Immersive Bootcamp', instructorId: instructorId || 'instructor1' },
          { id: '2', title: 'Course: React JS Frontend Web Development for Beginners', instructorId: instructorId || 'instructor2' },
          { id: '3', title: 'Course: Introduction To Python Programming', instructorId: instructorId || 'instructor3' }
        ]);
      } else {
        setCourses(availableCourses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      // Fallback to mock courses if Firebase fails
      setCourses([
        { id: '1', title: 'Course: The Python Developer Essentials Immersive Bootcamp', instructorId: instructorId || 'instructor1' },
        { id: '2', title: 'Course: React JS Frontend Web Development for Beginners', instructorId: instructorId || 'instructor2' },
        { id: '3', title: 'Course: Introduction To Python Programming', instructorId: instructorId || 'instructor3' }
      ]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Handle final submission
      console.log('Learning reminder created/updated:', formData);
      if (onSave) {
        onSave(formData);
      }
      setIsOpen(false);
      setStep(1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFrequencyChange = (frequency:any) => {
    setFormData(prev => ({ ...prev, frequency }));
  };

  const toggleDay = (dayShort:any) => {
    setFormData((prev:any) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayShort)
        ? prev.selectedDays.filter((d:any) => d !== dayShort)
        : [...prev.selectedDays, dayShort]
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name
          <span className="text-purple-600 text-sm font-normal ml-2">optional</span>
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Learning reminder"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Attach content (optional)
        </label>
        <div className="text-sm text-gray-600 mb-3">Most recent courses or labs:</div>
        
        {/* Search input */}
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search courses..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10" 
          />
        </div>
        
        {loadingCourses ? (
          <div className="text-sm text-gray-500">Loading courses...</div>
        ) : (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
            <RadioGroup 
              value={formData.attachedContent} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, attachedContent: value }))}
              className="space-y-2"
            >
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <div key={course.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <RadioGroupItem id={`course-${course.id}`} value={`course-${course.id}`} className="text-sm">
                      {course.title}
                    </RadioGroupItem>
                    <label className='font-semibold cursor-pointer flex-1 text-sm' htmlFor={`course-${course.id}`}>
                      {course.title}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 p-2">No courses found matching "{searchTerm}"</div>
              )}
              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded border-t pt-3 mt-2">
                <RadioGroupItem id='none' value="none" className="text-sm">
                  None
                </RadioGroupItem>
                <label className='font-semibold cursor-pointer flex-1 text-sm' htmlFor="none">None</label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Frequency</label>
        <div className="flex gap-3">
          {['Daily', 'Weekly', 'Once'].map((freq) => (
            <button
              key={freq}
              onClick={() => handleFrequencyChange(freq.toLowerCase())}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                formData.frequency === freq.toLowerCase()
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Time</label>
        <div className="relative">
          <Input
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            className="pr-10"
          />
          <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      {formData.frequency === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Day</label>
          <div className="flex gap-2 flex-wrap">
            {days.map((day:{short:string, full:string}) => (
              <button
                key={day.short}
                onClick={() => toggleDay(day.short)}
                className={`w-12 h-10 rounded-md text-sm font-medium transition-colors ${
                  formData.selectedDays.includes(day.short as never)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Review your learning reminder</h3>
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div><span className="font-medium">Name:</span> {formData.name}</div>
        <div><span className="font-medium">Frequency:</span> {formData.frequency}</div>
        <div><span className="font-medium">Time:</span> {formData.time}</div>
        {formData.frequency === 'weekly' && formData.selectedDays.length > 0 && (
          <div><span className="font-medium">Days:</span> {formData.selectedDays.join(', ')}</div>
        )}
        <div><span className="font-medium">Content:</span> {formData.attachedContent === 'none' ? 'None' : 'Course attached'}</div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    const baseTitle = editingReminder ? 'Edit Learning Reminder' : 'Learning reminders';
    switch (step) {
      case 1: return baseTitle;
      case 2: return baseTitle;
      case 3: return 'Confirm reminder';
      default: return baseTitle;
    }
  };

  return (
    <>
      

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>{getStepTitle()}</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">Step {step} of 3</p>
            </div>
          </DialogHeader>

          <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={step === 1}
              className={step === 1 ? 'invisible' : ''}
            >
              Previous
            </Button>
            <Button onClick={handleNext}>
              {step === 3 ? (editingReminder ? 'Update Reminder' : 'Create Reminder') : 'Next'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LearningReminderDialog;