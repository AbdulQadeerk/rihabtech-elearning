// Helper function to transform API curriculum data to form structure
export const transformApiCurriculumToForm = (curriculum: any) => {
  if (!curriculum || !curriculum.sections) return curriculum;
  
  return {
    ...curriculum,
    sections: curriculum.sections.map((section: any, sectionIndex: number) => ({
      ...section,
      seqNo: section.seqNo != null ? section.seqNo : (sectionIndex + 1),
      published: section.published !== undefined ? section.published : true,
      items: section.items ? section.items.map((item: any, itemIndex: number) => {
        // Transform based on item type
        const transformedItem: any = {
          ...item,
          seqNo: item.seqNo != null ? item.seqNo : (itemIndex + 1),
          published: item.published !== undefined ? item.published : true,
        };

        // Transform quiz items
        if (item.type === 'quiz') {
          transformedItem.type = 'quiz';
          transformedItem.quizTitle = item.quizTitle || '';
          transformedItem.quizDescription = item.quizDescription || '';
          transformedItem.duration = item.duration || 0;
          transformedItem.contentType = item.contentType || 'quiz';
          transformedItem.lectureName = item.quizTitle || 'Quiz';
          
          // Transform questions - ensure correctOption is an array
          if (item.questions && Array.isArray(item.questions)) {
            transformedItem.questions = item.questions.map((q: any) => ({
              id: q.id,
              question: q.question || '',
              options: q.options || [],
              correctOption: Array.isArray(q.correctOption) ? q.correctOption : (q.correctOption !== undefined ? [q.correctOption] : [])
            }));
          } else {
            transformedItem.questions = [];
          }
          
          // Preserve resources if they exist
          if (item.resources) {
            transformedItem.resources = item.resources;
          }
        }
        // Transform assignment items
        else if (item.type === 'assignment') {
          transformedItem.type = 'assignment';
          transformedItem.title = item.title || '';
          transformedItem.description = item.description || '';
          transformedItem.duration = item.duration || 0;
          transformedItem.totalMarks = item.totalMarks || 0;
          transformedItem.contentType = item.contentType || 'assignment';
          transformedItem.lectureName = item.title || 'Assignment';
          
          // Transform questions - API returns questions, form uses questions
          if (item.questions && Array.isArray(item.questions)) {
            transformedItem.questions = item.questions.map((q: any) => ({
              id: q.id,
              question: q.question || '',
              marks: q.marks || 0,
              answer: q.answer || '',
              maxWordLimit: q.maxWordLimit || 0
            }));
          } else {
            transformedItem.questions = [];
          }
          
          // Preserve resources if they exist
          if (item.resources) {
            transformedItem.resources = item.resources;
          }
        }
        // Transform lecture items
        else if (item.type === 'lecture') {
          transformedItem.type = 'lecture';
          transformedItem.lectureName = item.lectureName || '';
          transformedItem.description = item.description || '';
          transformedItem.contentType = item.contentType || 'video';
          transformedItem.isPromotional = item.isPromotional || false;
          transformedItem.duration = item.duration || 0;
          
          // Transform contentFiles - ensure they have the correct structure
          if (item.contentFiles && Array.isArray(item.contentFiles)) {
            transformedItem.contentFiles = item.contentFiles.map((file: any) => ({
              id: file.id,
              name: file.name || '',
              url: file.url || '',
              cloudinaryUrl: file.url || file.cloudinaryUrl || '',
              duration: file.duration || 0,
              status: file.status || 'uploaded'
            }));
          } else {
            transformedItem.contentFiles = [];
          }
          
          // Handle contentUrl for external videos/articles
          if (item.contentUrl) {
            transformedItem.contentUrl = item.contentUrl;
          }
          
          // Handle contentText for articles
          if (item.contentText) {
            transformedItem.contentText = item.contentText;
          }
          
          // Determine videoSource/articleSource based on contentUrl and contentFiles
          if (item.contentType === 'video') {
            transformedItem.videoSource = item.contentUrl ? 'link' : (item.contentFiles?.length > 0 ? 'upload' : 'upload');
          } else if (item.contentType === 'article') {
            transformedItem.articleSource = item.contentUrl ? 'link' : (item.contentText ? 'write' : (item.contentFiles?.length > 0 ? 'upload' : 'write'));
          }
          
          // Preserve resources if they exist
          if (item.resources) {
            transformedItem.resources = item.resources;
          }
        }
        
        return transformedItem;
      }) : []
    }))
  };
};

// Helper function to sort curriculum by seqNo
export const sortCurriculumBySeqNo = (curriculum: any) => {
  if (!curriculum || !curriculum.sections) return curriculum;
  
  return {
    ...curriculum,
    sections: curriculum.sections
      ?.sort((a: any, b: any) => (a.seqNo || 0) - (b.seqNo || 0))
      ?.map((section: any) => ({
        ...section,
        items: section.items
          ?.sort((a: any, b: any) => (a.seqNo || 0) - (b.seqNo || 0))
      }))
  };
};

// Helper function to strip files from curriculum for localStorage
export const stripFilesFromCurriculumForStorage = (curriculum: any): any => {
  if (!curriculum) return curriculum;
  
  // Deep clone to avoid mutating original
  const clone = JSON.parse(JSON.stringify(curriculum));
  
  function clean(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(clean).filter(v => v !== undefined);
    } else if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          // Skip File objects
          if (obj[key] instanceof File) {
            continue;
          }
          
          // Special handling for sections
          if (key === 'sections' && Array.isArray(obj[key])) {
            newObj[key] = obj[key].map((section: any, sectionIndex: number) => {
              if (!section) return null;
              
              const { id, name, published, items } = section;
              
              const result: any = {};
              if (id !== undefined) result.id = id;
              if (name !== undefined) result.name = name;
              if (published !== undefined) result.published = published;
              result.seqNo = sectionIndex + 1;
              if (items !== undefined) result.items = clean(items);
              
              return result;
            }).filter(Boolean);
          }
          // Special handling for items
          else if (key === 'items' && Array.isArray(obj[key])) {
            newObj[key] = obj[key].map((item: any, itemIndex: number) => {
              if (!item) return null;
              
              const { id, type, lectureName, description, contentType, contentUrl, articleSource, videoSource, isPromotional, duration, published, contentFiles, resources, quizTitle, quizDescription, title, totalMarks, questions } = item;
              
              const result: any = {};
              if (id !== undefined) result.id = id;
              if (type !== undefined) result.type = type;
              if (lectureName !== undefined) result.lectureName = lectureName;
              if (description !== undefined) result.description = description;
              if (contentType !== undefined) result.contentType = contentType;
              if (contentUrl !== undefined) result.contentUrl = contentUrl;
              if (articleSource !== undefined) result.articleSource = articleSource;
              if (videoSource !== undefined) result.videoSource = videoSource;
              if (isPromotional !== undefined) result.isPromotional = isPromotional;
              if (duration !== undefined) result.duration = duration;
              if (published !== undefined) result.published = published;
              result.seqNo = itemIndex + 1;
              if (contentFiles !== undefined) result.contentFiles = clean(contentFiles);
              if (resources !== undefined) result.resources = clean(resources);
              
              // Handle quiz-specific fields
              if (type === 'quiz') {
                if (quizTitle !== undefined) result.quizTitle = quizTitle;
                if (quizDescription !== undefined) result.quizDescription = quizDescription;
                if (questions !== undefined) result.questions = questions;
                result.contentType = "quiz";
                result.lectureName = quizTitle || "Quiz";
              }
              
              // Handle assignment-specific fields
              if (type === 'assignment') {
                if (title !== undefined) result.title = title;
                if (totalMarks !== undefined) result.totalMarks = totalMarks;
                if (questions !== undefined) result.questions = questions; // Keep as questions for localStorage
                result.contentType = "assignment";
                result.lectureName = title || "Assignment";
              }
              
              return result;
            }).filter(Boolean);
          }
          // Special handling for contentFiles
          else if (key === 'contentFiles' && Array.isArray(obj[key])) {
            newObj[key] = obj[key].map((cf: any) => {
              if (!cf) return null;
              if (cf instanceof File) return null; // Skip File objects
              
              const { id, name, url, cloudinaryUrl, cloudinaryPublicId, duration, status } = cf;
              
              const result: any = {};
              if (id !== undefined) result.id = id;
              if (name !== undefined) result.name = name;
              if (cloudinaryUrl !== undefined) result.url = cloudinaryUrl;
              else if (url !== undefined) result.url = url;
              if (cloudinaryPublicId !== undefined) result.cloudinaryPublicId = cloudinaryPublicId;
              if (duration !== undefined) result.duration = duration;
              if (status !== undefined) result.status = status;
              
              return result;
            }).filter(Boolean);
          }
          // Special handling for resources
          else if (key === 'resources' && Array.isArray(obj[key])) {
            newObj[key] = obj[key].map((res: any) => {
              if (!res) return null;
              if (res instanceof File) return null; // Skip File objects
              
              const { id, name, url, cloudinaryUrl, cloudinaryPublicId, type } = res;
              
              const result: any = {};
              if (id !== undefined) result.id = id;
              if (name !== undefined) result.name = name;
              if (cloudinaryUrl !== undefined) result.url = cloudinaryUrl;
              else if (url !== undefined) result.url = url;
              if (cloudinaryPublicId !== undefined) result.cloudinaryPublicId = cloudinaryPublicId;
              if (type !== undefined) result.type = type;
              
              return result;
            }).filter(Boolean);
          } else {
            newObj[key] = clean(obj[key]);
          }
        }
      }
      return newObj;
    }
    return obj;
  }
  
  return clean(clone);
};

