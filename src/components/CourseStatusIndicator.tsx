import React from 'react';
import { CourseStatus, COURSE_STATUS, COURSE_STATUS_TEXT } from '../utils/firebaseCourses';

interface CourseStatusIndicatorProps {
  status: CourseStatus;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CourseStatusIndicator: React.FC<CourseStatusIndicatorProps> = ({
  status,
  showIcon = true,
  showText = true,
  size = 'md',
  className = ''
}) => {
  const getStatusConfig = (status: CourseStatus) => {
    switch (status) {
      case COURSE_STATUS.DRAFT:
        return {
          icon: '📝',
          text: COURSE_STATUS_TEXT[status],
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        };
      case COURSE_STATUS.PENDING_REVIEW:
        return {
          icon: '⏳',
          text: COURSE_STATUS_TEXT[status],
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300'
        };
      case COURSE_STATUS.NEEDS_REVISION:
        return {
          icon: '🔄',
          text: COURSE_STATUS_TEXT[status],
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-300'
        };
      case COURSE_STATUS.APPROVED:
        return {
          icon: '✅',
          text: COURSE_STATUS_TEXT[status],
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300'
        };
      case COURSE_STATUS.PUBLISHED:
        return {
          icon: '🌐',
          text: COURSE_STATUS_TEXT[status],
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300'
        };
      case COURSE_STATUS.ARCHIVED:
        return {
          icon: '📦',
          text: COURSE_STATUS_TEXT[status],
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-300'
        };
      case COURSE_STATUS.DRAFT_UPDATE:
        return {
          icon: '✏️',
          text: COURSE_STATUS_TEXT[status],
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-300'
        };
      default:
        return {
          icon: '❓',
          text: 'Unknown',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'text-xs',
          text: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'text-lg',
          text: 'text-base'
        };
      default: // md
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'text-sm',
          text: 'text-sm'
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses.container}
        ${className}
      `}
    >
      {showIcon && (
        <span className={`mr-1 ${sizeClasses.icon}`}>
          {config.icon}
        </span>
      )}
      {showText && (
        <span className={sizeClasses.text}>
          {config.text}
        </span>
      )}
    </span>
  );
};

// Course status badge with additional info
interface CourseStatusBadgeProps extends CourseStatusIndicatorProps {
  showDetails?: boolean;
  course?: {
    submittedAt?: string;
    approvedAt?: string;
    rejectedAt?: string;
    isLocked?: boolean;
    lockReason?: string;
  };
}

export const CourseStatusBadge: React.FC<CourseStatusBadgeProps> = ({
  status,
  showDetails = false,
  course,
  ...props
}) => {
  const getStatusDetails = () => {
    if (!showDetails || !course) return null;

    switch (status) {
      case COURSE_STATUS.PENDING_REVIEW:
        return course.submittedAt ? (
          <div className="text-xs text-gray-500 mt-1">
            Submitted: {new Date(course.submittedAt).toLocaleDateString()}
          </div>
        ) : null;
      case COURSE_STATUS.APPROVED:
        return course.approvedAt ? (
          <div className="text-xs text-gray-500 mt-1">
            Approved: {new Date(course.approvedAt).toLocaleDateString()}
          </div>
        ) : null;
      case COURSE_STATUS.NEEDS_REVISION:
        return course.rejectedAt ? (
          <div className="text-xs text-gray-500 mt-1">
            Needs Revision: {new Date(course.rejectedAt).toLocaleDateString()}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const isLocked = course?.isLocked && status === COURSE_STATUS.PENDING_REVIEW;

  return (
    <div className="inline-block">
      <div className="relative">
        <CourseStatusIndicator status={status} {...props} />
        {isLocked && (
          <div className="absolute -top-1 -right-1">
            <span className="inline-flex items-center justify-center w-3 h-3 bg-red-500 text-white text-xs rounded-full">
              🔒
            </span>
          </div>
        )}
      </div>
      {getStatusDetails()}
      {isLocked && course?.lockReason && (
        <div className="text-xs text-gray-500 mt-1">
          {course.lockReason}
        </div>
      )}
    </div>
  );
};
