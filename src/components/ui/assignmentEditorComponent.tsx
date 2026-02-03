import { AssignmentQuestion } from "../../pages/instructor/course/addcourse/carriculam";
import { Button } from "./../ui/button";
import { Input } from "./../ui/input";
import { Textarea } from "./../ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface AssignmentEditorProps {
  sectionIdx: number;
  itemIdx: number;
  title: string;
  description: string;
  duration: number;
  questions: AssignmentQuestion[];
  onUpdate: (field: string, value: any) => void;
}

export function AssignmentEditor({
  sectionIdx,
  itemIdx,
  title,
  description,
  duration,
  questions,
  onUpdate,
}: AssignmentEditorProps) {
  const handleAddQuestion = () => {
    const newQuestions = [...questions, { question: "", marks: 0 }];
    onUpdate("questions", newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = questions.filter((_, idx) => idx !== index);
    onUpdate("questions", newQuestions);
  };

  const updateQuestion = (index: number, field: keyof AssignmentQuestion, value: string | number) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    onUpdate("questions", newQuestions);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Assignment Title</label>
        <Input
          value={title}
          onChange={(e) => onUpdate("title", e.target.value)}
          placeholder="Enter assignment title"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={description}
          onChange={(e) => onUpdate("description", e.target.value)}
          placeholder="Enter assignment description"
          className="w-full min-h-[100px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
        <Input
          type="number"
          value={duration}
          onChange={(e) => onUpdate("duration", parseInt(e.target.value))}
          placeholder="Enter duration in minutes"
          min={1}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Questions</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQuestion}
            className="flex items-center gap-1"
          >
            <Plus size={16} /> Add Question
          </Button>
        </div>

        {questions.map((q, idx) => (
          <div key={idx} className="border rounded-md p-4 space-y-3">
            <div className="flex items-start justify-between">
              <label className="block text-sm font-medium">Question {idx + 1}</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveQuestion(idx)}
              >
                <Trash2 size={16} className="text-red-500" />
              </Button>
            </div>

            <Textarea
              value={q.question}
              onChange={(e) => updateQuestion(idx, "question", e.target.value)}
              placeholder="Enter your question"
              className="w-full"
            />

            <div>
              <label className="block text-sm font-medium mb-1">Marks</label>
              <Input
                type="number"
                value={q.marks}
                onChange={(e) => updateQuestion(idx, "marks", parseInt(e.target.value))}
                placeholder="Enter marks for this question"
                min={0}
                className="w-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}