import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { qnaApiService, QNA as QNAItem } from "../../../utils/qnaApiService";

interface QNAProps {
  courseId?: string;
}

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${Math.floor(diffInSeconds / 60) === 1 ? 'Minute' : 'Minutes'} Ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${Math.floor(diffInSeconds / 3600) === 1 ? 'Hour' : 'Hours'} Ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ${Math.floor(diffInSeconds / 86400) === 1 ? 'Day' : 'Days'} Ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} ${Math.floor(diffInSeconds / 2592000) === 1 ? 'Month' : 'Months'} Ago`;
  return `${Math.floor(diffInSeconds / 31536000)} ${Math.floor(diffInSeconds / 31536000) === 1 ? 'Year' : 'Years'} Ago`;
};

// Helper function to get initial from name
const getInitial = (name?: string): string => {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
};

export default function QNA({ courseId }: QNAProps) {
  const { user } = useAuth();
  const [qnas, setQnas] = useState<QNAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    const loadQNA = async () => {
      try {
        setLoading(true);
        setError(null);
        const courseIdNum = parseInt(courseId, 10);
        if (isNaN(courseIdNum)) {
          throw new Error('Invalid course ID');
        }
        
        const qnaData = await qnaApiService.getCourseQNA(courseIdNum);
        setQnas(qnaData);
      } catch (err) {
        console.error('Error loading QNA:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Q&A');
      } finally {
        setLoading(false);
      }
    };

    loadQNA();
  }, [courseId]);

  const handleSubmitQuestion = async () => {
    if (!courseId || !newQuestion.trim() || !user) {
      return;
    }

    try {
      setSubmitting(true);
      const courseIdNum = parseInt(courseId, 10);
      if (isNaN(courseIdNum)) {
        throw new Error('Invalid course ID');
      }

      await qnaApiService.createQNA({
        courseId: courseIdNum,
        question: newQuestion.trim()
      });

      setNewQuestion("");
      // Reload QNA
      const qnaData = await qnaApiService.getCourseQNA(courseIdNum);
      setQnas(qnaData);
    } catch (err) {
      console.error('Error submitting question:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full mx-auto">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-500">Loading Q&A...</p>
        </div>
      </div>
    );
  }

  if (error && qnas.length === 0) {
    return (
      <div className="w-full mx-auto">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {user && (
        <div className="flex justify-between items-center mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-800 text-white flex items-center justify-center text-3xl mb-1 font-normal mr-4">
            {getInitial((user as any)?.name || (user as any)?.UserName || (user as any)?.email || undefined)}
          </div>
          <Input 
            placeholder="Please Enter Your Question" 
            className="w-[80%]"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !submitting) {
                handleSubmitQuestion();
              }
            }}
          />
          <Button 
            className="ml-4"
            onClick={handleSubmitQuestion}
            disabled={submitting || !newQuestion.trim()}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {qnas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="text-gray-500 text-center">No questions yet. Be the first to ask a question!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {qnas.map((qna) => (
            <div key={qna.id} className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-800 text-white flex items-center justify-center text-3xl mb-1 font-normal mr-4">
                    {getInitial(qna.userName)}
                  </div>
                  <div>
                    <h3 className="text-black text-[15px] font-medium font-['Poppins'] mb-2">
                      {qna.userName || qna.userEmail || 'Anonymous'}
                    </h3>
                  </div>
                </div>
                <span className="text-[#676767] text-xs font-medium font-['Poppins']">
                  {formatTimeAgo(qna.createdAt)}
                </span>
              </div>
              
              <p className="text-[#3d3d3d] text-sm font-normal font-['Poppins'] mt-3 mb-3">
                {qna.question}
              </p>

              {qna.answer && (
                <div className="ml-20 mt-3 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {qna.answeredByName || 'Instructor'}
                    </span>
                    {qna.answeredAt && (
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(qna.answeredAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-[#3d3d3d] text-sm font-normal font-['Poppins']">
                    {qna.answer}
                  </p>
                </div>
              )}

              {qna.replies && qna.replies.length > 0 && (
                <div className="ml-20 mt-3 space-y-3">
                  {qna.replies.map((reply) => (
                    <div key={reply.id} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {reply.userName || reply.userEmail || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-[#3d3d3d] text-sm font-normal font-['Poppins']">
                        {reply.question}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
