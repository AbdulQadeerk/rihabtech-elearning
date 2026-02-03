// Course Status Constants
export interface CourseStatusItem {
  id: number;
  text: string;
}

export const EN_COURSE_STATUS: CourseStatusItem[] = [
  { id: 1, text: 'Draft' },            // Created but not submitted yet
  { id: 2, text: 'Pending Review' },   // Submitted, waiting for approval
  { id: 3, text: 'Needs Revision' },   // Reviewer rejected & sent back
  { id: 4, text: 'Approved' },         // Approved by reviewer
  { id: 5, text: 'Published' },        // Visible to learners or private access
  { id: 6, text: 'Archived' },         // Retired / not visible anymore
  { id: 7, text: 'Draft Update' },    // Edited after publish → waiting re-approval
];

// Helper functions
export const getStatusById = (id: number): string => {
  const status = EN_COURSE_STATUS.find(item => item.id === id);
  return status ? status.text : 'Unknown';
};

export const getStatusColor = (statusId: number): string => {
  switch (statusId) {
    case 1: // Draft
      return 'bg-gray-400';
    case 2: // Pending Review
      return 'bg-yellow-400';
    case 3: // Needs Revision
      return 'bg-red-400';
    case 4: // Approved
      return 'bg-blue-500';
    case 5: // Published
      return 'bg-green-500';
    case 6: // Archived
      return 'bg-gray-600';
    case 7: // Draft Update
      return 'bg-orange-400';
    default:
      return 'bg-gray-400';
  }
};

export const getStatusBackgroundColor = (statusId: number): string => {
  switch (statusId) {
    case 1: // Draft
      return 'bg-gray-50';
    case 2: // Pending Review
      return 'bg-yellow-50';
    case 3: // Needs Revision
      return 'bg-red-50';
    case 4: // Approved
      return 'bg-blue-50';
    case 5: // Published
      return 'bg-green-50';
    case 6: // Archived
      return 'bg-gray-50';
    case 7: // Draft Update
      return 'bg-orange-50';
    default:
      return 'bg-gray-50';
  }
};

export const getStatusTextColor = (statusId: number): string => {
  switch (statusId) {
    case 1: // Draft
      return 'text-gray-700';
    case 2: // Pending Review
      return 'text-yellow-700';
    case 3: // Needs Revision
      return 'text-red-700';
    case 4: // Approved
      return 'text-blue-700';
    case 5: // Published
      return 'text-green-700';
    case 6: // Archived
      return 'text-gray-700';
    case 7: // Draft Update
      return 'text-orange-700';
    default:
      return 'text-gray-700';
  }
};

// Status constants for easy reference
export const COURSE_STATUS = {
  DRAFT: 1,
  PENDING_REVIEW: 2,
  NEEDS_REVISION: 3,
  APPROVED: 4,
  PUBLISHED: 5,
  ARCHIVED: 6,
  DRAFT_UPDATE: 7,
} as const;

export type CourseStatusType = typeof COURSE_STATUS[keyof typeof COURSE_STATUS];
