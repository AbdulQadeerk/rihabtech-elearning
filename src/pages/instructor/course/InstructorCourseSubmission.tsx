import React, { useState, useEffect } from 'react';
import { CourseWorkflowService } from '../../../utils/courseWorkflowService';
import { Course, COURSE_STATUS } from '../../../utils/firebaseCourses';
import { CourseSubmissionModal } from '../../../components/CourseSubmissionModal';
import { CourseStatusIndicator } from '../../../components/CourseStatusIndicator';
import { getLanguageLabel } from '../../../utils/languages';
import { getLevelLabel } from '../../../utils/levels';

interface InstructorCourseSubmissionProps {
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
}

export const InstructorCourseSubmission: React.FC<InstructorCourseSubmissionProps> = ({
  instructorId,
  instructorName,
  instructorEmail
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const coursesData = await CourseWorkflowService.getInstructorCourses(instructorId);
      setCourses(coursesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowSubmissionModal(true);
  };

  const handleSubmissionSuccess = () => {
    fetchCourses();
    setShowSubmissionModal(false);
    setSelectedCourse(null);
  };

  const canSubmitCourse = (course: Course) => {
    return course.status === COURSE_STATUS.DRAFT && 
           course.title && 
           course.description && 
           course.category && 
            (course.curriculum?.sections?.length || 0) > 0;
  };

  const getStatusActions = (course: Course) => {
    switch (course.status) {
      case COURSE_STATUS.DRAFT:
        return (
          <button
            onClick={() => handleSubmitCourse(course)}
            disabled={!canSubmitCourse(course)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              canSubmitCourse(course)
                ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit for Review
          </button>
        );
      case COURSE_STATUS.PENDING_REVIEW:
        return (
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              Under Review
            </span>
            {course.isLocked && (
              <span className="text-xs text-gray-500">🔒 Locked</span>
            )}
          </div>
        );
      case COURSE_STATUS.APPROVED:
        return (
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
              Approved
            </span>
            <button
              onClick={() => window.location.href = `/instructor/courses/${course.id}/publish`}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Publish
            </button>
          </div>
        );
      case COURSE_STATUS.DRAFT_UPDATE:
        return (
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
              Published
            </span>
            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              ⏳ Pending Review
            </span>
            {course.hasUnpublishedChanges && (
              <span className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                Changes Awaiting Approval
              </span>
            )}
          </div>
        );
      case COURSE_STATUS.NEEDS_REVISION:
        return (
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-sm rounded-full ${
              'bg-orange-100 text-orange-800'
            }`}>
              Needs Revision
            </span>
            <button
              onClick={() => window.location.href = `/instructor/courses/${course.id}/edit`}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit & Resubmit
            </button>
          </div>
        );
      case COURSE_STATUS.PUBLISHED:
        return (
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
              Published
            </span>
            {course.hasUnpublishedChanges && (
              <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                ⚠️ Has Pending Changes
              </span>
            )}
            <a
              href={`/course/${course.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              View Live
            </a>
            <button
              onClick={() => window.location.href = `/instructor/courses/${course.id}/edit`}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Edit
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="mt-2 text-gray-600">
            Manage your courses and submit them for review
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses List */}
        <div className="bg-white shadow rounded-lg">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No courses found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by creating your first course.
              </p>
              <button
                onClick={() => window.location.href = '/instructor/courses/new'}
                className="bg-indigo-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Create New Course
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {courses.map((course) => (
                <div key={course.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {course.title}
                        </h3>
                        <CourseStatusIndicator 
                          status={course.status} 
                          showIcon={true}
                          showText={true}
                        />
                        {course.isLocked && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Category: {course.category}</span>
                        <span>Level: {getLevelLabel(course.level || "beginner")}</span>
                        <span>Language: {getLanguageLabel(course.language)}</span>
                        <span>Price: {course.pricing}</span>
                        {course.updatedAt && (
                          <span>
                            Updated: {new Date(course.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      {getStatusActions(course)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submission Modal */}
        {selectedCourse && (
          <CourseSubmissionModal
            course={selectedCourse}
            isOpen={showSubmissionModal}
            onClose={() => setShowSubmissionModal(false)}
            onSuccess={handleSubmissionSuccess}
            instructorId={instructorId}
            instructorName={instructorName}
            instructorEmail={instructorEmail}
          />
        )}
      </div>
    </div>
  );
};
