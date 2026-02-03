import {
  Dialog,
  DialogContent,
  DialogHeader,
  
} from "../../../components/ui/dialog";
import { useState, useEffect } from "react";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { DialogTitle } from "../../../components/ui/dialog";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: { heading: string; content: string }) => void;
  initialData?: { heading: string; content: string };
  title?: string;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title = "Create New Note"
}: CreateNoteDialogProps) {
  const [heading, setHeading] = useState(initialData?.heading || "");
  const [content, setContent] = useState(initialData?.content || "");

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setHeading(initialData.heading);
      setContent(initialData.content);
    } else {
      setHeading("");
      setContent("");
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (heading.trim() && content.trim()) {
      onSubmit({ heading, content });
      setHeading("");
      setContent("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Note Heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {initialData ? "Update Note" : "Save Note"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}