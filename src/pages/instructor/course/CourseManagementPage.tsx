import React, { useState, useEffect } from 'react';
import { CourseWorkflowService } from '../../../utils/courseWorkflowService';
import { Course, COURSE_STATUS } from '../../../utils/firebaseCourses';
import { CourseSubmissionModal } from '../../../components/CourseSubmissionModal';
import { CourseStatusIndicator } from '../../../components/CourseStatusIndicator';
import { CourseHistoryModal } from '../../../components/CourseHistoryModal';
import { getLanguageLabel } from '../../../utils/languages';
import { getLevelLabel } from '../../../utils/levels';

interface CourseManagementPageProps {
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
}

export const CourseManagementPage: React.FC<CourseManagementPageProps> = ({
  instructorId,
  instructorName,
  instructorEmail
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');

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

  const handleViewHistory = (course: Course) => {
    setSelectedCourse(course);
    setShowHistoryModal(true);
  };

  const handleEditCourse = (course: Course) => {
    // Navigate to course edit page
    window.location.href = `/instructor/courses/${course.id}/edit`;
  };

  const handlePublishCourse = async (course: Course) => {
    if (course.status === COURSE_STATUS.APPROVED) {
      try {
        await CourseWorkflowService.publishCourse(
          course.id,
          instructorId,
          instructorName,
          instructorEmail
        );
        fetchCourses();
      } catch (err: any) {
        setError(err.message || 'Failed to publish course');
      }
    }
  };

  const filteredCourses = courses.filter(course => 
    filter === 'all' || course.status === parseInt(filter)
  );

  const getStatusActions = (course: Course) => {
    switch (course.status) {
      case COURSE_STATUS.DRAFT:
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditCourse(course)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={() => handleSubmitCourse(course)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit for Review
            </button>
          </div>
        );
      case COURSE_STATUS.PENDING_REVIEW:
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewHistory(course)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              View History
            </button>
            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded">
              Under Review
            </span>
          </div>
        );
      case COURSE_STATUS.APPROVED:
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handlePublishCourse(course)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Publish
            </button>
            <button
              onClick={() => handleViewHistory(course)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              History
            </button>
          </div>
        );
      case COURSE_STATUS.NEEDS_REVISION:
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditCourse(course)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit & Resubmit
            </button>
            <button
              onClick={() => handleViewHistory(course)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              History
            </button>
          </div>
        );
      case COURSE_STATUS.PUBLISHED:
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditCourse(course)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={() => handleViewHistory(course)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              History
            </button>
            <a
              href={`/course/${course.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              View Live
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  const getCourseStats = () => {
    const stats = {
      total: courses.length,
      draft: courses.filter(c => c.status === COURSE_STATUS.DRAFT).length,
      pending: courses.filter(c => c.status === COURSE_STATUS.PENDING_REVIEW).length,
      approved: courses.filter(c => c.status === COURSE_STATUS.APPROVED).length,
      published: courses.filter(c => c.status === COURSE_STATUS.PUBLISHED).length,
      needsRevision: courses.filter(c => c.status === COURSE_STATUS.NEEDS_REVISION).length
    };
    return stats;
  };

  const stats = getCourseStats();

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
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your courses and track their approval status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{stats.total}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">{stats.published}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.published}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">{stats.pending}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Under Review</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">{stats.draft}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.draft}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Actions */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <label htmlFor="filter" className="text-sm font-medium text-gray-700">
                  Filter by status:
                </label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Courses</option>
                  <option value={COURSE_STATUS.DRAFT}>Draft</option>
                  <option value={COURSE_STATUS.PENDING_REVIEW}>Pending Review</option>
                  <option value={COURSE_STATUS.APPROVED}>Approved</option>
                  <option value={COURSE_STATUS.PUBLISHED}>Published</option>
                  <option value={COURSE_STATUS.NEEDS_REVISION}>Needs Revision</option>
                </select>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => window.location.href = '/instructor/courses/new'}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Create New Course
                </button>
              </div>
            </div>
          </div>
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
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No courses found' : `No ${filter.replace('_', ' ')} courses`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? 'Get started by creating your first course.'
                  : 'Try changing the filter or create a new course.'
                }
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
              {filteredCourses.map((course) => (
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

        {/* Modals */}
        {selectedCourse && (
          <>
            <CourseSubmissionModal
              course={selectedCourse}
              isOpen={showSubmissionModal}
              onClose={() => setShowSubmissionModal(false)}
              onSuccess={handleSubmissionSuccess}
              instructorId={instructorId}
              instructorName={instructorName}
              instructorEmail={instructorEmail}
            />
            
            <CourseHistoryModal
              courseId={selectedCourse.id}
              isOpen={showHistoryModal}
              onClose={() => setShowHistoryModal(false)}
            />
          </>
        )}
      </div>
    </div>
  );
};
