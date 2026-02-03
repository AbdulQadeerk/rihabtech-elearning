import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Star
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../context/AuthContext';
import { assignmentService, Assignment, AssignmentSubmission, CreateAssignmentData } from '../../../utils/assignmentService';
import { toast } from 'sonner';

interface AssignmentStats {
  totalAssignments: number;
  totalSubmissions: number;
  pendingGrading: number;
  averageGrade: number;
}

export default function AssignmentTab() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [stats, setStats] = useState<AssignmentStats>({
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingGrading: 0,
    averageGrade: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [newAssignment, setNewAssignment] = useState<CreateAssignmentData>({
    title: '',
    description: '',
    instructorId: '',
    instructorName: '',
    dueDate: new Date(),
    maxPoints: 100,
    instructions: '',
    attachments: []
  });

  const { user } = useAuth();

  useEffect(() => {
    if (user?.UserName) {
      loadAssignments();
    }
  }, [user?.UserName]);

  const loadAssignments = async () => {
    if (!user?.UserName) return;

    try {
      setLoading(true);
      const [assignmentsData, statsData] = await Promise.all([
        assignmentService.getInstructorAssignments(user.UserName),
        assignmentService.getAssignmentStats(user.UserName)
      ]);
      
      setAssignments(assignmentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!user?.UserName) return;

    try {
      const assignmentData = {
        ...newAssignment,
        instructorId: user.UserName,
        instructorName: user.UserName
      };

      await assignmentService.createAssignment(assignmentData);
      toast.success('Assignment created successfully!');
      setShowCreateForm(false);
      setNewAssignment({
        title: '',
        description: '',
        instructorId: '',
        instructorName: '',
        dueDate: new Date(),
        maxPoints: 100,
        instructions: '',
        attachments: []
      });
      loadAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    }
  };

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    if (!user?.UserName) return;

    try {
      await assignmentService.gradeSubmission(submissionId, grade, feedback, user.UserName);
      toast.success('Submission graded successfully!');
      loadAssignments();
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Failed to grade submission');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await assignmentService.deleteAssignment(assignmentId);
      toast.success('Assignment deleted successfully!');
      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (dueDate: Date) => {
    const now = new Date();
    const diffInHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) return 'text-red-500';
    if (diffInHours < 24) return 'text-orange-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Assignment Management</h2>
          <Button onClick={() => setShowCreateForm(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalAssignments}</p>
            <p className="text-sm text-gray-600">Total Assignments</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalSubmissions}</p>
            <p className="text-sm text-gray-600">Submissions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.pendingGrading}</p>
            <p className="text-sm text-gray-600">Pending Grading</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.averageGrade.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Average Grade</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Assignments List */}
        <div className="w-1/2 border-r bg-white">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Assignments</h3>
          </div>
          <div className="overflow-y-auto h-full">
            {assignments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No assignments created yet</p>
                <p className="text-sm">Create your first assignment to get started</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedAssignment?.id === assignment.id ? 'bg-blue-50 border-primary' : ''
                    }`}
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssignment(assignment);
                            setShowSubmissions(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAssignment(assignment.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className={getStatusColor(assignment.dueDate)}>
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{assignment.submissions?.length || 0} submissions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        <span>{assignment.maxPoints} points</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assignment Details */}
        <div className="w-1/2 bg-gray-50">
          {selectedAssignment ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-white">
                <h3 className="text-lg font-semibold">{selectedAssignment.title}</h3>
                <p className="text-sm text-gray-600">{selectedAssignment.courseName}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-700">{selectedAssignment.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Instructions</h4>
                    <p className="text-sm text-gray-700">{selectedAssignment.instructions}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Due Date</h4>
                      <p className={`text-sm ${getStatusColor(selectedAssignment.dueDate)}`}>
                        {formatDate(selectedAssignment.dueDate)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Max Points</h4>
                      <p className="text-sm text-gray-700">{selectedAssignment.maxPoints}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Submissions ({selectedAssignment.submissions?.length || 0})</h4>
                    {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                      <div className="space-y-2">
                        {selectedAssignment.submissions.map((submission) => (
                          <div key={submission.id} className="p-3 bg-white border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-sm">{submission.studentName}</p>
                                <p className="text-xs text-gray-500">
                                  Submitted: {formatDate(submission.submittedAt)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {submission.isGraded ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    Graded: {submission.grade}/{selectedAssignment.maxPoints}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{submission.content}</p>
                            {submission.feedback && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="text-xs font-medium text-gray-600">Feedback:</p>
                                <p className="text-xs text-gray-700">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No submissions yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select an Assignment</p>
                <p className="text-sm">Choose an assignment to view details and submissions</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter assignment title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Enter assignment description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={newAssignment.dueDate.toISOString().slice(0, 16)}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
                  <input
                    type="number"
                    value={newAssignment.maxPoints}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Enter detailed instructions for students"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAssignment}
                disabled={!newAssignment.title || !newAssignment.description}
              >
                Create Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
