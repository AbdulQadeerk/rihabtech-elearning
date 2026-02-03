import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { XCircle } from 'lucide-react';

interface RejectionInfo {
  rejectedAt: Date;
  rejectedBy: {
    email: string;
    name: string;
    timestamp: Date;
    userId: string;
  };
  rejectionNotes: string;
  rejectionReason: string;
}

interface CourseRejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectionInfo?: RejectionInfo;
}

export function CourseRejectionDialog({
  open,
  onOpenChange,
  rejectionInfo,
}: CourseRejectionDialogProps) {
  if (!rejectionInfo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="h-6 w-6 text-red-500" />
              <DialogTitle>Course Review Feedback</DialogTitle>
            </div>
            <DialogDescription className="text-left space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-md p-4">
                <h3 className="font-medium text-red-800">Review Status: Rejected</h3>
                <p className="text-red-700 mt-1">Reason: {rejectionInfo.rejectionReason}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Reviewer Notes:</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded border">
                  {rejectionInfo.rejectionNotes}
                </p>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>Reviewed by: {rejectionInfo.rejectedBy.name}</p>
                <p>Reviewed on: {format(rejectionInfo.rejectedAt, 'PPP \'at\' p')}</p>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                Please address the feedback above and resubmit your course for another review.
                If you need help, contact our instructor support team.
              </p>
            </DialogDescription>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}