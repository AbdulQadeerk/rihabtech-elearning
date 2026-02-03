import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Video, FileText, Play } from 'lucide-react';
import { Course } from '../../../utils/firebaseCourses';

interface Lecture {
  title: string;
  type: 'video' | 'file';
  duration: string;
  preview?: boolean;
  videoUrl?: string;
  contentFiles?: any[];
  isPromotional?: boolean;
}

interface Section {
  title: string;
  lectures: Lecture[];
  totalDuration: string;
}

interface CurriculumProps {
  course: Course;
  onPreviewCourse?: () => void;
  lectureIndex?: number;
  sectionIndex?: number;
}

export default function Curriculum({ course, onPreviewCourse,lectureIndex,sectionIndex }: CurriculumProps) {
  const [openSections, setOpenSections] = useState<number[]>([lectureIndex ?? -1].filter(i => i >= 0));

  const toggleSection = (index: number) => {
    setOpenSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Transform Firebase curriculum data to match the expected format
  const transformCurriculumData = (): Section[] => {
    console.log('Transform curriculum data - Course:', course);
    console.log('Curriculum sections:', course.curriculum?.sections);
    
    if (!course.curriculum?.sections || course.curriculum.sections.length === 0) {
      return [
        {
          title: 'Course Content',
          totalDuration: '0min',
          lectures: [
            { title: 'No curriculum available yet', type: 'file' as const, duration: '00:00' }
          ],
        }
      ];
    }

    return course.curriculum.sections.map((section, index) => {
      let totalDurationSeconds = 0;
      console.log(`Processing section: ${section.name} with ${section.items?.length || 0} items`);
      
      if (section.items) {
        section.items.forEach((item, itemIndex) => {
          console.log(`Processing item ${itemIndex}:`, item.lectureName, 'Type:', item.contentType);
          console.log(`Item contentFiles:`, item.contentFiles);
          
          if (item.contentFiles && item.contentFiles.length > 0) {
            item.contentFiles.forEach((file, fileIndex) => {
              console.log(`File ${fileIndex}: ${file.name}, Duration: ${file.duration}, Type: ${typeof file.duration}`);
              
              // Simplified duration check - just check if it's a valid number
              if (file.duration !== undefined && file.duration !== null) {
                let durationValue: number;
                
                if (typeof file.duration === 'string') {
                  durationValue = parseFloat(file.duration);
                } else {
                  durationValue = file.duration;
                }
                
                if (!isNaN(durationValue) && durationValue > 0) {
                  totalDurationSeconds += durationValue;
                  console.log(`Adding duration: ${durationValue} seconds from file: ${file.name}`);
                } else {
                  console.log(`Invalid duration value: ${file.duration} for file: ${file.name}`);
                }
              } else {
                console.log(`No duration found for file: ${file.name}`);
              }
            });
          } else {
            console.log(`No contentFiles found for item: ${item.lectureName}`);
          }
        });
      }
      
      console.log(`Section ${section.name}: Total duration seconds: ${totalDurationSeconds}`);
      
      // Calculate total duration in minutes
      const totalDurationMinutes = totalDurationSeconds / 60;
      console.log(`Section ${section.name}: Total duration minutes: ${totalDurationMinutes}`);
      
      const totalDuration = totalDurationSeconds > 0 
        ? (totalDurationMinutes >= 1 ? Math.round(totalDurationMinutes) : Math.round(totalDurationMinutes * 10) / 10) + 'min'
        : '0min';
      
      console.log(`Section ${section.name}: Final formatted duration: ${totalDuration}`);

      const lectures: Lecture[] = section.items ? section.items.map(item => {
        console.log(`Processing item:`, item);
        console.log(`Item isPromotional:`, item.isPromotional);
        console.log(`Item contentFiles:`, item.contentFiles);
        
        const contentType = item.contentType === 'video' ? 'video' : 'file';
        let duration = '00:00';
        let videoUrl = '';
        
        // Calculate duration from content files
        if (item.contentFiles && item.contentFiles.length > 0) {
          const totalDurationSeconds = item.contentFiles.reduce((sum, file) => {
            console.log(`File duration check:`, file.name, 'Duration:', file.duration, 'Type:', typeof file.duration);
            
            if (file.duration !== undefined && file.duration !== null) {
              let durationValue: number;
              
              // Handle different duration formats
              if (typeof file.duration === 'string') {
                // Check if it's already formatted as "MM:SS" or "HH:MM:SS"
                if (file.duration.includes(':')) {
                  const parts = file.duration.split(':');
                  if (parts.length === 2) {
                    // Format: "MM:SS"
                    durationValue = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
                  } else if (parts.length === 3) {
                    // Format: "HH:MM:SS"
                    durationValue = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
                  } else {
                    durationValue = parseFloat(file.duration);
                  }
                } else {
                  // Try to parse as number
                  durationValue = parseFloat(file.duration);
                }
              } else {
                durationValue = file.duration;
              }
              
              console.log(`Parsed duration value:`, durationValue);
              
              if (!isNaN(durationValue) && durationValue > 0) {
                return sum + durationValue;
              }
            }
            return sum;
          }, 0);
          
          if (totalDurationSeconds > 0) {
            const minutes = Math.floor(totalDurationSeconds / 60);
            const seconds = Math.floor(totalDurationSeconds % 60);
            duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            console.log(`Lecture ${item.lectureName}: Duration calculated: ${duration} (${totalDurationSeconds} seconds)`);
          }
        }
        
        if (item.contentFiles && item.contentFiles.length > 0) {
          const videoFile = item.contentFiles.find(file => {
            const isVideoByType = (file as any).contentType === 'video';
            const isVideoByName = file.name?.toLowerCase().includes('.mp4') || 
                                file.name?.toLowerCase().includes('.mov') ||
                                file.name?.toLowerCase().includes('.avi');
            const isVideoByUrl = file.url?.toLowerCase().includes('.mp4') || 
                               file.url?.toLowerCase().includes('.mov') ||
                               file.url?.toLowerCase().includes('.avi');
            const isVideoByContentType = (file as any).contentType === 'video';
            
            return isVideoByType || isVideoByName || isVideoByUrl || isVideoByContentType;
          });
          
          if (videoFile) {
            videoUrl = videoFile.url || 
                      (videoFile as any).downloadURL || 
                      (videoFile as any).cloudinaryUrl || 
                      (videoFile as any).publicUrl || 
                      (videoFile as any).secureUrl ||
                      '';
            console.log('Found video file:', videoFile, 'URL:', videoUrl);
          } else {
            const anyFile = item.contentFiles.find(file => file.url || (file as any).downloadURL);
            if (anyFile) {
              videoUrl = anyFile.url || (anyFile as any).downloadURL || '';
              console.log('Found any file with URL:', anyFile, 'URL:', videoUrl);
            }
          }
        }

        if (!videoUrl && (item as any).contentUrl && item.contentType === 'video') {
          videoUrl = (item as any).contentUrl;
          console.log('Using item contentUrl:', videoUrl);
        }
        
        if (!videoUrl && item.contentType === 'video' && course.promoVideoUrl) {
          videoUrl = course.promoVideoUrl;
          console.log('Using course promo video as fallback:', videoUrl);
        }
        
        if (!videoUrl && item.contentType === 'video') {
          videoUrl = '/courses/video2 - Trim.mp4';
          console.log('Using test video as fallback:', videoUrl);
        }
        
                 return {
           title: item.lectureName || 'Untitled Lecture',
           type: contentType,
           duration: duration,
           preview: item.published || false,
           videoUrl: videoUrl,
           contentFiles: item.contentFiles,
           isPromotional: item.isPromotional || false
         };
      }) : [];

      return {
        title: section.name || `Section ${index + 1}`,
        lectures: lectures,
        totalDuration: totalDuration
      };
    });
  };

  const courseSections = transformCurriculumData();

  return (
    <>
      {/* Course Content Overview */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Course Content Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {courseSections.reduce((total, section) => total + section.lectures.length, 0)}
            </div>
            <div className="text-blue-700">Total Lectures</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {courseSections.reduce((total, section) => 
                total + section.lectures.filter(l => l.type === 'video' && l.videoUrl).length, 0
              )}
            </div>
            <div className="text-green-700">Preview Videos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {courseSections.reduce((total, section) => 
                total + section.lectures.filter(l => l.type === 'video' && !l.videoUrl).length, 0
              )}
            </div>
            <div className="text-orange-700">Full Access Only</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {courseSections.reduce((total, section) => 
                total + section.lectures.filter(l => l.type === 'file').length, 0
              )}
            </div>
            <div className="text-purple-700">Documents</div>
          </div>
        </div>
      </div>

      {/* Curriculum Sections */}
      <div className="w-full max-w-3xl mx-auto text-sm">
        {courseSections.map((section, index) => {
          const isOpen = openSections.includes(index);
          return (
            <div key={index} className="border-b border-gray-200 mb-4">
              <button
                onClick={() => toggleSection(index)}
                className="w-full flex items-center justify-between bg-primary/10 text-primary px-4 py-3 font-semibold text-left hover:bg-primary/20 transition-all rounded-t-lg"
              >
                <div>
                  {section.title} <span className="ml-2 text-xs font-normal text-gray-500">{section.lectures.length} lectures • {section.totalDuration}</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isOpen && (
                <ul className="bg-white divide-y rounded-b-lg shadow-sm">
                  {section.lectures.map((lecture, i) => (
                    <li key={i} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        {lecture.type === 'video' ? <Video size={16} className="text-primary" /> : <FileText size={16} className="text-gray-500" />}
                        <span className="text-gray-800">
                          {lecture.title}
                        </span>
                         {lecture.type === 'video' && lecture.videoUrl && (lecture.isPromotional === true || lecture.preview === true) && (
                           <button
                             onClick={() => onPreviewCourse?.()}
                             className="ml-2 px-2 py-1 text-xs text-primary border border-primary rounded hover:bg-primary hover:text-white transition-colors"
                           >
                             Preview
                           </button>
                         )}
                        {lecture.type === 'video' && !lecture.videoUrl && (
                          <span className="ml-2 text-xs text-gray-400">(No preview)</span>
                        )}
                        {lecture.preview && (
                          <span className="ml-2 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">Preview</span>
                        )}
                      </div>
                      <span className="text-gray-500 text-xs font-medium">{lecture.duration}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
