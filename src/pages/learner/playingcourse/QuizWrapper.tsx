import React, { useState, useEffect } from 'react';
import QuizPage from './quizPageQn';

const QuizWrapper: React.FC = () => {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [assignmentId, setAssignmentId] = useState<number | null>(null);
  const [lectureId, setLectureId] = useState<number | null>(null);

  useEffect(() => {
    // Get quiz data from URL parameters (check both search and hash)
    const hash = window.location.hash;
    const search = window.location.search;
    
    let dataParam = null;
    let courseIdParam = null;
    let sectionIdParam = null;
    let quizIdParam = null;
    let assignmentIdParam = null;
    let lectureIdParam = null;
    
    // Check hash first (for #/learner/quiz?data=...)
    if (hash.includes('?')) {
      const hashParams = new URLSearchParams(hash.split('?')[1]);
      dataParam = hashParams.get('data');
      courseIdParam = hashParams.get('courseId');
      sectionIdParam = hashParams.get('sectionId');
      quizIdParam = hashParams.get('quizId');
      assignmentIdParam = hashParams.get('assignmentId');
      lectureIdParam = hashParams.get('lectureId');
    }
    
    // If not found in hash, check search params
    if (!dataParam) {
      const urlParams = new URLSearchParams(search);
      dataParam = urlParams.get('data');
      if (!courseIdParam) courseIdParam = urlParams.get('courseId');
      if (!sectionIdParam) sectionIdParam = urlParams.get('sectionId');
      if (!quizIdParam) quizIdParam = urlParams.get('quizId');
      if (!assignmentIdParam) assignmentIdParam = urlParams.get('assignmentId');
      if (!lectureIdParam) lectureIdParam = urlParams.get('lectureId');
    }
    
    console.log('QuizWrapper - Looking for data:', { hash, search, dataParam, courseIdParam, sectionIdParam, quizIdParam, assignmentIdParam });
    
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        console.log('QuizWrapper - Parsed quiz data:', parsedData);
        setQuizData(parsedData);
      } catch (error) {
        console.error('Error parsing quiz data:', error);
      }
    } else {
      console.log('No quiz data found in URL');
    }
    
    if (courseIdParam) {
      const id = parseInt(courseIdParam, 10);
      if (!isNaN(id)) setCourseId(id);
    }
    
    if (sectionIdParam) {
      const id = parseInt(sectionIdParam, 10);
      if (!isNaN(id)) setSectionId(id);
    }
    
    if (quizIdParam) {
      const id = parseInt(quizIdParam, 10);
      if (!isNaN(id)) setQuizId(id);
    }
    
    if (assignmentIdParam) {
      const id = parseInt(assignmentIdParam, 10);
      if (!isNaN(id)) setAssignmentId(id);
    }
    
    if (lectureIdParam) {
      const id = parseInt(lectureIdParam, 10);
      if (!isNaN(id)) setLectureId(id);
    }
    
    setLoading(false);
  }, []);

  return <QuizPage 
    quizData={quizData} 
    loading={loading}
    courseId={courseId}
    sectionId={sectionId}
    quizId={quizId}
    assignmentId={assignmentId}
    lectureId={lectureId}
  />;
};

export default QuizWrapper;
