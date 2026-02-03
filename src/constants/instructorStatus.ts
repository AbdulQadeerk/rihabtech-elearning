// Instructor Status Constants
export interface InstructorStatusItem {
  id: number;
  text: string;
  description?: string;
}

export const EN_INSTRUCTOR_STATUS: InstructorStatusItem[] = [
  { 
    id: 1, 
    text: 'Pending',
    description: 'Application submitted, waiting for review'
  },
  { 
    id: 2, 
    text: 'Approved',
    description: 'Application approved by admin'
  },
  { 
    id: 3, 
    text: 'Rejected',
    description: 'Application rejected by admin'
  },
  { 
    id: 4, 
    text: 'On Hold',
    description: 'Application put on hold for further review'
  }
];

// Status mapping for API responses
export const getStatusById = (id: number): InstructorStatusItem | undefined => {
  return EN_INSTRUCTOR_STATUS.find(status => status.id === id);
};

// Status mapping for UI display (converts API id to string status)
export const getStatusTextById = (id: number): string => {
  const status = getStatusById(id);
  return status ? status.text.toLowerCase().replace(' ', '_') : 'unknown';
};

// Reverse mapping for UI status to API id
export const getStatusIdByText = (statusText: string): number | undefined => {
  const status = EN_INSTRUCTOR_STATUS.find(status => 
    status.text.toLowerCase().replace(' ', '_') === statusText.toLowerCase()
  );
  return status ? status.id : undefined;
};

// Status colors for UI
export const getStatusColor = (id: number): string => {
  switch (id) {
    case 1: return 'text-orange-600'; // Pending
    case 2: return 'text-green-600';  // Approved
    case 3: return 'text-red-600';    // Rejected
    case 4: return 'text-yellow-600'; // On Hold
    default: return 'text-blue-600';
  }
};

// Status background colors for UI
export const getStatusBackgroundColor = (id: number): string => {
  switch (id) {
    case 1: return 'bg-orange-50 border-orange-200 text-orange-800'; // Pending
    case 2: return 'bg-green-50 border-green-200 text-green-800';   // Approved
    case 3: return 'bg-red-50 border-red-200 text-red-800';         // Rejected
    case 4: return 'bg-yellow-50 border-yellow-200 text-yellow-800'; // On Hold
    default: return 'bg-blue-50 border-blue-200 text-blue-800';
  }
};

// Button colors for different statuses
export const getStatusButtonColor = (id: number): string => {
  switch (id) {
    case 1: return 'bg-orange-600 hover:bg-orange-700'; // Pending
    case 2: return 'bg-green-600 hover:bg-green-700';   // Approved
    case 3: return 'bg-red-600 hover:bg-red-700';       // Rejected
    case 4: return 'bg-yellow-600 hover:bg-yellow-700'; // On Hold
    default: return 'bg-primary hover:bg-orange-600';
  }
};

// Status messages for different statuses
export const getStatusMessage = (id: number): string => {
  switch (id) {
    case 1: return 'Your application is under review';
    case 2: return 'Congratulations! Your application has been approved';
    case 3: return 'Your application has been rejected';
    case 4: return 'Your application is on hold for further review';
    default: return 'Your application has been submitted';
  }
};

// Status descriptions for info boxes
export const getStatusDescription = (id: number): { title: string; message: string } => {
  switch (id) {
    case 1:
      return {
        title: "What's Next?",
        message: "Our admin team is reviewing your application. This usually takes 1-3 business days. You'll be notified once a decision is made."
      };
    case 2:
      return {
        title: "Welcome to our instructor community!",
        message: "You can now start creating and publishing courses. Access your instructor dashboard to get started."
      };
    case 3:
      return {
        title: "Application Not Approved",
        message: "Your application didn't meet our current requirements. You can reapply after addressing any feedback provided."
      };
    case 4:
      return {
        title: "Application Under Additional Review",
        message: "Your application is on hold for further review. Our team may need additional information or clarification. You'll be contacted if any additional steps are required."
      };
    default:
      return {
        title: "Application Status",
        message: "Your application status is being processed."
      };
  }
};
