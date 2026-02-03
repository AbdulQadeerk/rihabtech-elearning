import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

interface SubmitReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitReviewDialog({ open, onOpenChange }: SubmitReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">
              Course Submitted Successfully
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Your course has been submitted for review. We will notify you once the review process is complete. This typically takes 2-3 business days.
            </DialogDescription>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}