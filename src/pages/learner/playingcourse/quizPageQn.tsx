import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, Flag, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { quizProgressApiService } from '../../../utils/quizProgressApiService';
import { assignmentProgressApiService } from '../../../utils/assignmentProgressApiService';

interface QuizQuestion {
  id?: number | string;
  question: string;
  options?: string[];
  correctOption?: number[];
  answer?: string;
  marks?: number;
  maxWordLimit?: number;
  type: 'multiple_choice' | 'essay';
}

interface QuizData {
  quizTitle: string;
  quizDescription: string;
  duration: number;
  questions: QuizQuestion[];
  totalMarks?: number;
  isAssignment?: boolean;
}

interface QuizPageProps {
  quizData?: QuizData | null;
  loading?: boolean;
  courseId?: number | null;
  sectionId?: number | null;
  quizId?: number | null;
  assignmentId?: number | null;
  lectureId?: number | null;
}

const QuizPage: React.FC<QuizPageProps> = ({ 
  quizData: propQuizData, 
  loading = false,
  courseId,
  sectionId,
  quizId,
  assignmentId,
  lectureId
}) => {
  console.log('QuizPage received props:', { propQuizData, loading, courseId, sectionId, quizId, assignmentId, lectureId });
  
  // Determine if this is an assignment
  // Check multiple sources: prop data, assignmentId presence, or if quizId is actually an assignment
  const isAssignment = propQuizData?.isAssignment || 
                       assignmentId !== null || 
                       (quizId !== null && propQuizData?.isAssignment === true);
  
  // If we have assignmentId but quizId was passed, use assignmentId
  const finalAssignmentId = assignmentId || (isAssignment && quizId ? quizId : null);
  const finalQuizId = !isAssignment ? quizId : null;
  
  const quizStartTime = useRef<number | null>(null);
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Default quiz data for fallback
  const defaultQuizData: QuizData = {
    quizTitle: "Knowledge Check: Research Basics",
    quizDescription: "Test your understanding of basic UX research concepts. This quiz covers fundamental principles, methods, and best practices in user experience research.",
    duration: 15,
    questions: [
      {
        question: "What are the primary goals of UX research? (Select all that apply)",
        options: [
          "Understanding user needs and behaviors",
          "Validating design decisions",
          "Increasing conversion rates",
          "Identifying usability issues",
          "Reducing development costs"
        ],
        correctOption: [0, 1, 3],
        type: 'multiple_choice'
      }
    ]
  };

  // Use prop data or default data
  const quizData = propQuizData || defaultQuizData;
  
  console.log('QuizPage final quizData:', quizData);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(quizData.duration * 60); // in seconds
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());

  // Update time remaining when quiz data changes
  useEffect(() => {
    setTimeRemaining(quizData.duration * 60);
  }, [quizData.duration]);

  // Timer effect
  useEffect(() => {
    if (quizStarted && !quizCompleted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setQuizCompleted(true);
            setShowResults(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, quizCompleted, timeRemaining]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection for multiple choice
  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => {
      const currentAnswers = prev[questionIndex] || [];
      const newAnswers = currentAnswers.includes(optionIndex)
        ? currentAnswers.filter((idx) => idx !== optionIndex)
        : [...currentAnswers, optionIndex];
      
      const updated = {
        ...prev,
        [questionIndex]: newAnswers
      };
      
      // Save progress incrementally (debounced)
      saveProgress(updated, essayAnswers);
      
      return updated;
    });
  };

  // Handle essay answer input
  const handleEssayAnswer = (questionIndex: number, answer: string) => {
    setEssayAnswers((prev) => {
      const updated = {
        ...prev,
        [questionIndex]: answer
      };
      
      // Save progress incrementally (debounced)
      saveProgress(selectedAnswers, updated);
      
      return updated;
    });
  };
  
  // Save progress incrementally (debounced to avoid too many API calls)
  const saveProgress = async (answers: Record<number, number[]>, essayAnswers: Record<number, string>) => {
    // For assignments, we don't save incrementally - only on submit
    if (isAssignment) {
      return;
    }
    
    // Only save if we have the required IDs (skip for assignments)
    if (!courseId || !sectionId || !finalQuizId) {
      console.log('Missing required IDs for saving quiz progress:', { courseId, sectionId, finalQuizId });
      return;
    }
    
    // Clear existing timeout
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
    }
    
    // Debounce: save after 2 seconds of no changes
    saveProgressTimeoutRef.current = setTimeout(async () => {
      try {
        // Convert answers to the format expected by the API
        const answerArray: Array<{ questionId: number; selectedOptions: number[] }> = [];
        
        // Get question IDs from quiz data
        quizData.questions.forEach((question, index) => {
          if (question.type === 'multiple_choice') {
            const selectedOptions = answers[index] || [];
            // Use index as questionId if question doesn't have an id property
            const questionId = (question as any).id || index;
            answerArray.push({
              questionId: typeof questionId === 'string' ? parseInt(questionId, 10) : questionId,
              selectedOptions: selectedOptions
            });
          }
        });
        
        const answersJson = JSON.stringify(answerArray);
        const timeSpent = quizStartTime.current 
          ? Math.floor((Date.now() - quizStartTime.current) / 1000)
          : 0;
        
        // Save progress (this will create/update QuizProgress but not mark as completed)
        await quizProgressApiService.submitQuiz({
          courseId: courseId,
          sectionId: sectionId,
          lectureId: lectureId || undefined,
          quizId: finalQuizId!,
          answers: answersJson,
          timeSpent: timeSpent
        });
        
        console.log('Quiz progress saved incrementally');
      } catch (error) {
        console.error('Error saving quiz progress:', error);
      }
    }, 2000); // 2 second debounce
  };

  // Navigate questions
  const goToQuestion = (index:any) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Flag/unflag question
  const toggleFlag = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newFlags = new Set(prev);
      if (newFlags.has(questionIndex)) {
        newFlags.delete(questionIndex);
      } else {
        newFlags.add(questionIndex);
      }
      return newFlags;
    });
  };

  // Submit quiz or assignment
  const submitQuiz = async () => {
    // Clear any pending progress saves
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
      saveProgressTimeoutRef.current = null;
    }
    
    const timeSpent = quizStartTime.current 
      ? Math.floor((Date.now() - quizStartTime.current) / 1000)
      : 0;
    
    // Handle assignment submission
    if (isAssignment && finalAssignmentId) {
      if (!courseId || !sectionId) {
        console.log('Missing required IDs for submitting assignment:', { courseId, sectionId, finalAssignmentId });
        setQuizCompleted(true);
        setShowResults(true);
        return;
      }
      
      try {
        // Convert essay answers to assignment submission format
        const submissionArray: Array<{ questionId: number; answer: string }> = [];
        
        quizData.questions.forEach((question, index) => {
          const questionId = (question as any).id || index;
          const answer = essayAnswers[index] || '';
          submissionArray.push({
            questionId: typeof questionId === 'string' ? parseInt(questionId, 10) : questionId,
            answer: answer
          });
        });
        
        const submissionJson = JSON.stringify(submissionArray);
        
        console.log('Submitting assignment:', { courseId, sectionId, assignmentId: finalAssignmentId, submission: submissionJson });
        
        // Submit assignment to API
        const result = await assignmentProgressApiService.submitAssignment({
          courseId: courseId,
          sectionId: sectionId,
          assignmentId: finalAssignmentId,
          submission: submissionJson,
          timeSpent: timeSpent
        });
        
        console.log('Assignment submitted successfully:', result);
      } catch (error) {
        console.error('Error submitting assignment:', error);
        // Still show results even if API call fails
      }
    }
    // Handle quiz submission
    else if (!isAssignment && finalQuizId) {
      if (!courseId || !sectionId) {
        console.log('Missing required IDs for submitting quiz:', { courseId, sectionId, finalQuizId });
        setQuizCompleted(true);
        setShowResults(true);
        return;
      }
      
      try {
        // Convert answers to the format expected by the API
        const answerArray: Array<{ questionId: number; selectedOptions: number[] }> = [];
        
        quizData.questions.forEach((question, index) => {
          if (question.type === 'multiple_choice') {
            const selectedOptions = selectedAnswers[index] || [];
            const questionId = (question as any).id || index;
            answerArray.push({
              questionId: typeof questionId === 'string' ? parseInt(questionId, 10) : questionId,
              selectedOptions: selectedOptions
            });
          }
        });
        
        const answersJson = JSON.stringify(answerArray);
        
        // Submit quiz to API
        const result = await quizProgressApiService.submitQuiz({
          courseId: courseId,
          sectionId: sectionId,
          lectureId: lectureId || undefined,
          quizId: finalQuizId,
          answers: answersJson,
          timeSpent: timeSpent
        });
        
        console.log('Quiz submitted successfully:', result);
      } catch (error) {
        console.error('Error submitting quiz:', error);
        // Still show results even if API call fails
      }
    } else {
      console.log('Missing required IDs or invalid type:', { isAssignment, finalQuizId, finalAssignmentId, quizId, assignmentId });
    }
    
    setQuizCompleted(true);
    setShowResults(true);
  };

  // Calculate results
  const calculateResults = () => {
    let totalCorrect = 0;
    let totalQuestions = quizData.questions.length;
    let totalMarks = 0;
    let earnedMarks = 0;

    quizData.questions.forEach((question, index) => {
      if (question.type === 'multiple_choice') {
        const userAnswers = selectedAnswers[index] || [];
        const correctAnswers = question.correctOption || [];
        
        // Check if user answers match correct answers exactly
        if (userAnswers.length === correctAnswers.length &&
            userAnswers.every((answer) => correctAnswers.includes(answer))) {
          totalCorrect++;
          earnedMarks += question.marks || 100;
        }
        totalMarks += question.marks || 100;
      } else if (question.type === 'essay') {
        const userAnswer = essayAnswers[index] || '';
        const correctAnswer = question.answer || '';
        
        // Simple text comparison for essay questions
        // In a real app, you might want more sophisticated comparison
        const similarity = calculateTextSimilarity(userAnswer.toLowerCase(), correctAnswer.toLowerCase());
        const questionMarks = question.marks || 100;
        
        if (similarity > 0.7) { // 70% similarity threshold
          totalCorrect++;
          earnedMarks += questionMarks;
        } else if (similarity > 0.4) { // Partial credit
          earnedMarks += questionMarks * 0.5;
        }
        
        totalMarks += questionMarks;
      }
    });

    const percentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
    const passed = percentage >= 80; // Default passing score

    return { 
      totalCorrect, 
      totalQuestions, 
      percentage, 
      passed, 
      earnedMarks, 
      totalMarks 
    };
  };

  // Simple text similarity calculation
  const calculateTextSimilarity = (text1: string, text2: string) => {
    if (!text1 || !text2) return 0;
    
    const words1 = text1.split(/\s+/).filter(word => word.length > 2);
    const words2 = text2.split(/\s+/).filter(word => word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz start screen
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{quizData.quizTitle}</h1>
            <p className="text-gray-600">{quizData.quizDescription}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-600 font-medium">Duration</p>
              <p className="text-lg font-bold text-blue-800">{quizData.duration} minutes</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">{quizData.isAssignment ? 'Assignments' : 'Questions'}</p>
              <p className="text-lg font-bold text-green-800">{quizData.questions.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <Flag className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-600 font-medium">{quizData.isAssignment ? 'Total Marks' : 'Passing Score'}</p>
              <p className="text-lg font-bold text-purple-800">{quizData.isAssignment ? `${quizData.totalMarks || 100}` : '80%'}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">Instructions:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Read each question carefully</li>
                  {quizData.isAssignment ? (
                    <>
                      <li>• Write detailed answers in the text boxes provided</li>
                      <li>• Pay attention to word limits and marking criteria</li>
                      <li>• Your answers will be automatically graded</li>
                    </>
                  ) : (
                    <>
                      <li>• Select all answers that apply using checkboxes</li>
                      <li>• You can flag questions for review</li>
                    </>
                  )}
                  <li>• Navigate between questions using the sidebar</li>
                  <li>• Submit when you're ready or when time runs out</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              quizStartTime.current = Date.now();
              setQuizStarted(true);
            }}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start {quizData.isAssignment ? 'Assignment' : 'Quiz'}
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const results = calculateResults();
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              results.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {results.passed ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {results.passed ? 'Congratulations!' : 'Try Again'}
            </h1>
            <p className="text-gray-600">
              {results.passed 
                ? 'You have successfully passed the quiz!' 
                : 'You need to score at least 80% to pass.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 font-medium">Your Score</p>
              <p className={`text-3xl font-bold ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
                {results.percentage}%
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 font-medium">
                {quizData.isAssignment ? 'Marks Earned' : 'Questions Correct'}
              </p>
              <p className="text-3xl font-bold text-gray-800">
                {quizData.isAssignment ? `${results.earnedMarks}/${results.totalMarks}` : `${results.totalCorrect}/${results.totalQuestions}`}
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                setQuizStarted(false);
                setQuizCompleted(false);
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setEssayAnswers({});
                setTimeRemaining(quizData.duration * 60);
                setFlaggedQuestions(new Set());
              }}
              className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retake {quizData.isAssignment ? 'Assignment' : 'Quiz'}
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{quizData.quizTitle}</h1>
              <p className="text-sm text-gray-600">
                {quizData.isAssignment ? 'Assignment' : 'Question'} {currentQuestionIndex + 1} of {quizData.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-blue-700'
              }`}>
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <Button
                onClick={submitQuiz}
                className="rounded-none"
              >
                Submit {quizData.isAssignment ? 'Assignment' : 'Quiz'}
              </Button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800 pr-4">
                  {currentQuestion.question}
                </h2>
                <button
                  onClick={() => toggleFlag(currentQuestionIndex)}
                  className={`p-2 rounded-full transition-colors ${
                    flaggedQuestions.has(currentQuestionIndex)
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-8">
                {currentQuestion.type === 'multiple_choice' ? (
                  currentQuestion.options?.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedAnswers[currentQuestionIndex]?.includes(index) || false}
                        onChange={() => handleAnswerSelect(currentQuestionIndex, index)}
                        onCheckedChange={()=>handleAnswerSelect(currentQuestionIndex, index)}
                        className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-blue-800">Marks: {currentQuestion.marks || 100}</span>
                        <span className="text-sm text-blue-600">
                          Word limit: {currentQuestion.maxWordLimit || 500} words
                        </span>
                      </div>
                    </div>
                    <textarea
                      value={essayAnswers[currentQuestionIndex] || ''}
                      onChange={(e) => handleEssayAnswer(currentQuestionIndex, e.target.value)}
                      placeholder="Write your answer here..."
                      className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="text-sm text-gray-500">
                      Word count: {(essayAnswers[currentQuestionIndex] || '').split(/\s+/).filter(word => word.length > 0).length} / {currentQuestion.maxWordLimit || 500}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>
                {currentQuestionIndex === quizData.questions.length - 1 || quizData.questions.length === 1 ? (
                  <button
                    onClick={submitQuiz}
                    className="flex items-center px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Submit {quizData.isAssignment ? 'Assignment' : 'Quiz'}
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="flex items-center px-4 py-2 text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigation Sidebar */}
          <div className="bg-white rounded-lg shadow-sm p-4 h-fit">
            <h3 className="font-semibold text-gray-800 mb-4">
              {quizData.isAssignment ? 'Assignments' : 'Questions'}
            </h3>
            <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
              {quizData.questions.map((question, index) => {
                const isAnswered = question.type === 'multiple_choice' 
                  ? selectedAnswers[index]?.length > 0
                  : essayAnswers[index]?.length > 0;
                
                return (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors relative ${
                      currentQuestionIndex === index
                        ? 'bg-primary text-white'
                        : isAnswered
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                    {flaggedQuestions.has(index) && (
                      <Flag className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
                    )}
                    {question.type === 'essay' && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 rounded mr-2"></div>
                  <span>Not answered</span>
                </div>
                <div className="flex items-center">
                  <Flag className="w-3 h-3 text-yellow-500 mr-2" />
                  <span>Flagged</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Essay question</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;