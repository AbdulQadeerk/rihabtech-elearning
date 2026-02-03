import { useState } from "react";
import { Checkbox } from "../../../../components/ui/checkbox";

type AccordionItem = {
    title: string;
    content: string[];
    checkboxLabel: string;
  };

export function Accessibility(){
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (index: number) => {
      setOpenIndex(openIndex === index ? null : index);
    };
    
      
      const accordionData: AccordionItem[] = [
        {
          title: 'Closed captions accessibility checklist',
          checkboxLabel: 'Captions in this course meet these guidelines',
          content: [
            'All auto-generated captions should be reviewed to check for accuracy. Captions must meet a 99% rate of accuracy.',
            'Any relevant sound effects pertinent to the course must be noted in the captions, example: (Beeps).',
            'Any non-speech elements such as music are captured in the captions, example: (Jazzy music).',
            'Verbal delivery style indicators are captured in the captions, example: (Exclaims).',
            'Captions identify speakers on and off camera.',
          ],
        },
        {
          title: 'Audio content accessibility checklist',
          checkboxLabel: 'Audio content in this course meets these guidelines',
          content: [],
        },
        {
          title: 'Course materials accessibility checklist',
          checkboxLabel: 'Materials attached to this course meet these guidelines',
          content: [],
        },
      ];
    return(
        <div>
            <h3 className="tip mb-2">Accessibility</h3>
            <div className="mb-3">

                <h4 className="tip-title ">
                Accessibility checklists
                </h4>
                <p className="course-sectional-descrption">
                To help you create accessible course content, we’ve provided Instructors with recommendations and best practices to consider while creating new courses or updating existing content. Please review these accessibility recommendations and checklists to indicate whether your course meets the guidelines.

Note: while these accessibility guidelines are strongly recommended, they are not a requirement prior to publishing your course. Though content that does meet these accessibility guidelines may benefit from a greater number of learners who could take your course.
                </p>
            </div>
            <div>
            {accordionData.map((item, index) => (
        <div key={index} className="border-b border-gray-300 py-4">
          <button
            className="flex justify-between items-center w-full text-left"
            onClick={() => toggle(index)}
          >
            <span className="text-lg font-semibold text-gray-800">{item.title}</span>
            <svg
              className={`w-5 h-5 transform transition-transform duration-200 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openIndex === index && (
            <div className="mt-3 pl-1 text-md text-gray-700 space-y-2">
              {item.content.map((point, i) => (
                <p key={i}>• {point}</p>
              ))}
              
            </div>
          )}

          <div className="mt-3">
            <label className="flex items-center gap-2 text-sm text-black">
              <Checkbox className="form-checkbox accent-purple-600" />
              {item.checkboxLabel}
            </label>
          </div>
        </div>
      ))}
            </div>
            
      </div>
    )
}