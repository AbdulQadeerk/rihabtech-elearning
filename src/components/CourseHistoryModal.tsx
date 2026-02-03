import React, { useState, useEffect } from 'react';
import { CourseWorkflowService } from '../utils/courseWorkflowService';
import { CourseHistoryEntry, CourseStatus, COURSE_STATUS, COURSE_STATUS_TEXT } from '../utils/firebaseCourses';

interface CourseHistoryModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseHistoryModal: React.FC<CourseHistoryModalProps> = ({
  courseId,
  isOpen,
  onClose
}) => {
  const [history, setHistory] = useState<CourseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && courseId) {
      fetchHistory();
    }
  }, [isOpen, courseId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const historyData = await CourseWorkflowService.getCourseHistory(courseId);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch course history');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'submitted_for_review':
        return '📤';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'sent_for_revision':
        return '🔄';
      case 'published':
        return '🌐';
      case 'archived':
        return '📦';
      case 'major_edit':
        return '📝';
      case 'minor_edit':
        return '✏️';
      default:
        return '📋';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'submitted_for_review':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'sent_for_revision':
        return 'text-orange-600 bg-orange-100';
      case 'published':
        return 'text-blue-600 bg-blue-100';
      case 'archived':
        return 'text-gray-600 bg-gray-100';
      case 'major_edit':
        return 'text-purple-600 bg-purple-100';
      case 'minor_edit':
        return 'text-indigo-600 bg-indigo-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatActionText = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Course History
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading history...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📋</div>
            <p className="text-gray-500">No history available for this course.</p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={entry.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getActionColor(entry.action)}`}>
                    {getActionIcon(entry.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {formatActionText(entry.action)}
                      </h4>
                      <time className="text-xs text-gray-500">
                        {formatTimestamp(entry.timestamp)}
                      </time>
                    </div>
                    
                    <div className="mt-1">
                      <p className="text-sm text-gray-600">
                        {entry.details}
                      </p>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        By: {entry.performedBy.name} ({entry.performedBy.email})
                      </span>
                      
                      {entry.previousStatus && entry.newStatus && (
                        <span className="flex items-center space-x-1">
                          <span>Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            entry.previousStatus === COURSE_STATUS.DRAFT ? 'bg-gray-100 text-gray-800' :
                            entry.previousStatus === COURSE_STATUS.PENDING_REVIEW ? 'bg-yellow-100 text-yellow-800' :
                            entry.previousStatus === COURSE_STATUS.APPROVED ? 'bg-green-100 text-green-800' :
                            entry.previousStatus === COURSE_STATUS.NEEDS_REVISION ? 'bg-orange-100 text-orange-800' :
                            entry.previousStatus === COURSE_STATUS.PUBLISHED ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {COURSE_STATUS_TEXT[entry.previousStatus]}
                          </span>
                          <span>→</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            entry.newStatus === COURSE_STATUS.DRAFT ? 'bg-gray-100 text-gray-800' :
                            entry.newStatus === COURSE_STATUS.PENDING_REVIEW ? 'bg-yellow-100 text-yellow-800' :
                            entry.newStatus === COURSE_STATUS.APPROVED ? 'bg-green-100 text-green-800' :
                            entry.newStatus === COURSE_STATUS.NEEDS_REVISION ? 'bg-orange-100 text-orange-800' :
                            entry.newStatus === COURSE_STATUS.PUBLISHED ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {COURSE_STATUS_TEXT[entry.newStatus]}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
