import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";

interface SubmitRequirementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missing?: Record<string, string[]>; // section -> list of unmet items
}

export function SubmitRequirementsDialog({
  open,
  onOpenChange,
  missing,
}: SubmitRequirementsDialogProps) {
  const hasMissing = missing && Object.keys(missing).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <DialogTitle>Why can't I submit for review?</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              <p className="mb-4">
                You're almost ready to submit your course. Below are the items that still need attention.
              </p>

              {hasMissing ? (
                <div className="space-y-4">
                  {Object.entries(missing || {}).map(([section, items]) => (
                    <div key={section}>
                      <h3 className="font-medium mb-2">{section}:</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {items.map((it) => <li key={it}>{it}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Fallback static text if no missing items provided */}
                  <div>
                    <h3 className="font-medium mb-2">On the Intended learners page:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Specify any course requirements or prerequisites</li>
                      <li>Specify at least 4 of your course's learning objectives</li>
                      <li>Specify who this course is for</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">On the Curriculum page:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Have at least 30 minutes of video content</li>
                      <li>Have at least 2 lectures</li>
                      <li>Have content for all lectures</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">On the Course landing page:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Have a course description with at least 200 words</li>
                      <li>Have a course subtitle</li>
                      <li>Have an instructor description with at least 50 words</li>
                      <li>Select the category of your course</li>
                      <li>Select the level of your course</li>
                      <li>Select the subcategory of your course</li>
                      <li>Select what is primarily taught in your course</li>
                      <li>Upload a course image</li>
                      <li>Upload an instructor image</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">On the Pricing page:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Select a price for your course</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-4">
                Once you complete these steps, you will be able to successfully submit your course for review.
              </div>
              <div className="mt-4 text-center">
                <Button onClick={()=>{window.location.href='#/instructor/course-sections'}}>Go to Course</Button>
              </div>
            </DialogDescription>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}