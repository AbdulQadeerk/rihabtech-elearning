import { JSX, useEffect, useState } from "react";
import { Check, ChevronRight, Book, BarChart2, Users, HelpCircle, MessageSquare, Film, FileText, Type, Layout, DollarSign, Megaphone, Captions, } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "../../../../components/ui/radio";
import { IntendentLearners } from "./intendedLearners";
import { CourseStructure } from "./courseStructur";
import { SetupTestVideo } from "./setuptestvideo";
import { CourseCarriculam } from "./carriculam";
import { CourseCaptions } from "./captions";
import { Accessibility } from "./accessibility";
import { CourseLandingPage } from "./coursePage";
import { CoursePromotions } from "./coursePromotions";
import { CourseMessages } from "./messages";
import { Button } from "../../../../components/ui/button";
import PracticeTest from "../addPracticetest/practiceMCQ";
import { SubmitReviewDialog } from "../../../../components/ui/submitReviewDialog";
import { SubmitRequirementsDialog } from "../../../../components/ui/submitrequiremntdialog";
import Pricing from "./pricing";
import CourseCouponsPage from "./coupens";

const CourseContent = () => {
    const [selectedItem, setSelectedItem] = useState("intended-learners");
    interface CreationItem {
        id: string;
        icon: JSX.Element;
        label: string;
    }

    const [creationItems, setcreationItems] = useState<CreationItem[]>([]);
       const [showReviewDialog, setShowReviewDialog] = useState(false);

    const handleSubmitReview = () => {
        window.location.hash = '#/instructor/course-preview';
        // setShowReviewDialog(true);
    };

    const fullItems: CreationItem[] = [
        { id: "intended-learners", icon: <Users size={18} />, label: "Intended learners" },
        // { id: "course-structure", icon: <Layout size={18} />, label: "Course structure" },
        // { id: "setup-test-video", icon: <Film size={18} />, label: "Setup & test video" },
        // { id: "film-edit", icon: <Film size={18} />, label: "Film & edit" },
        { id: "curriculum", icon: <FileText size={18} />, label: "Curriculum" },
        // { id: "captions", icon: <Type size={18} />, label: "Captions" },
        // { id: "accessibility", icon: <Users size={18} />, label: "Accessibility" },
        { id: "course-landing-page", icon: <Layout size={18} />, label: "Course landing page" },
        { id: "pricing", icon: <DollarSign size={18} />, label: "Pricing" },
        // { id: "promotions", icon: <Megaphone size={18} />, label: "Promotions" },
        { id: "course-messages", icon: <MessageSquare size={18} />, label: "Course messages" }
      ];
      

    useEffect(()=>{
        const testcourse = localStorage.getItem('addcourseType')
        if(testcourse=='practiceTest'){
            //setcreationItems([]);
            setcreationItems([
                { id: "intended-learners", icon: <Users size={18} />, label: "Intended learners" },
                { id: "practice-test", icon: <Users size={18} />, label: "Practise Test" },
                { id: "course-landing-page", icon: <Layout size={18} />, label: "Course landing page" },
                { id: "pricing", icon: <DollarSign size={18} />, label: "Pricing" },
                // { id: "coupons", icon: <Type size={18} />, label: "Coupens" },
                // { id: "promotions", icon: <Megaphone size={18} />, label: "Promotions" },
                { id: "course-messages", icon: <MessageSquare size={18} />, label: "Course messages" }
              ]) ;
        }else{
            //setcreationItems([]);
            setcreationItems([
                { id: "intended-learners", icon: <Users size={18} />, label: "Intended learners" },
                // { id: "course-structure", icon: <Layout size={18} />, label: "Course structure" },
                // { id: "setup-test-video", icon: <Film size={18} />, label: "Setup & test video" },
                // { id: "film-edit", icon: <Film size={18} />, label: "Film & edit" },
                { id: "curriculum", icon: <FileText size={18} />, label: "Curriculum" },
                // { id: "captions", icon: <Type size={18} />, label: "Captions" },
                // { id: "accessibility", icon: <Users size={18} />, label: "Accessibility" },
                { id: "course-landing-page", icon: <Layout size={18} />, label: "Course landing page" },
                { id: "pricing", icon: <DollarSign size={18} />, label: "Pricing" },
                // { id: "coupons", icon: <Type size={18} />, label: "Coupens" },
                // { id: "promotions", icon: <Megaphone size={18} />, label: "Promotions" },
                { id: "course-messages", icon: <MessageSquare size={18} />, label: "Course messages" }
              ]) ;
        }
    },[])
  

    return (
        <div className="flex flex-col justify-between h-full">
      <div className="px-4 md:px-8">
        {/* <h1 className="ins-heading mb-3">How much time can you spend creating your course?</h1> */}
        
        <div className="bg-gray-50 rounded-[18px] shadow-sm p-6">
        <h2 className="text-black text-[17px] font-medium font-['Urbanist'] mb-4">Course Creation</h2>
        
        <div className="flex flex-col md:flex-row">
          {/* Left column - Course creation steps */}
          <div className="w-full md:w-64 flex flex-row md:flex-col border-r border-gray-200 pr-6 overflow-x-scroll md:overflow-x-auto">
            {creationItems.map((item) => (
              <CourseCreationItem 
                key={item.id}
                icon={item.icon}
                label={item.label}
                checked={selectedItem === item.id}
                onClick={() => setSelectedItem(item.id)}
              />
            ))}
            <Button className="rounded-none hidden md:block" onClick={handleSubmitReview}>Preview Course</Button>
          </div>
          
          
          {/* Right column - Current step content */}
          <div className="flex-col md:flex-1 p-0 md:pl-6">
            {selectedItem === "intended-learners" && (
              <div>
                <IntendentLearners onSubmit={()=>{setSelectedItem('curriculum')}}/>
              </div>
            )}
            {selectedItem === "practice-test"&&(
                <PracticeTest/>
            )}
            {selectedItem === "course-structure" && (
              <div>
                <CourseStructure onSubmit={()=>{setSelectedItem('curriculum')}}/>
              </div>
            )}
            {/* {selectedItem === "setup-test-video" && (
              <div>
                <SetupTestVideo onSubmit={()=>{setSelectedItem('film-edit')}}/>
              </div>
            )}
            {selectedItem === "film-edit" && (
              <div>
                <SetupTestVideo onSubmit={()=>{setSelectedItem('curriculum')}}/>
              </div>
            )} */}
            {selectedItem === "curriculum" && (
              <div>
                <CourseCarriculam onSubmit={()=>{setSelectedItem('course-landing-page')}}/>
              </div>
            )}
            {/* {selectedItem === "captions" && (
              <div>
                <CourseCaptions/>
              </div>
            )}
            {selectedItem === "accessibility"&&(
                <Accessibility/>
            )} */}
            {selectedItem === "course-landing-page"&&(
                <CourseLandingPage onSubmit={()=>{setSelectedItem('pricing')}}/>
            )}
            {selectedItem === "pricing"&&(
                <Pricing 
                  draftId={localStorage.getItem('draftId') || 'test-draft-id'}
                  //onSubmit={()=>{setSelectedItem('coupons')}}
                  onSubmit={()=>{setSelectedItem('course-messages')}}
                />
            )}
            {selectedItem === "coupons"&&(
                <CourseCouponsPage  onSubmit={()=>{setSelectedItem('course-messages')}}
                />
            )}
            {selectedItem === "promotions" && (
              <div>
                <CoursePromotions/>
              </div>
            )}
            {selectedItem === "course-messages" && (
  <div>
    <CourseMessages />
    {/* <div className="flex justify-end mt-6">
      <Button className="bg-primary text-white px-6 py-2 rounded" onClick={() => { window.location.hash = '#/instructor/course-preview'; }}>
        Preview Course
      </Button>
    </div> */}
  </div>
)}
            {/* Add content for other steps */}
          </div>
        </div>
      </div>
      <div className="my-2">
      <Button className="rounded-none block md:hidden w-full" onClick={handleSubmitReview}>Preview Course</Button>
      </div>
      </div>
                  <SubmitRequirementsDialog 
                open={showReviewDialog} 
                onOpenChange={setShowReviewDialog}
            />
      
      </div>
    );
  };

  // Course Creation Item Component
interface CourseCreationItemProps {
  icon: React.ReactNode;
  label: string;
  checked?: boolean;
  onClick: () => void;
}

const CourseCreationItem: React.FC<CourseCreationItemProps> = ({ icon, label, checked = false, onClick }) => {
    return (
      <div className={`mb-4 flex items-center p-2 ${checked ? 'bg-primary rounded-[7px] ' : 'bg-transparent'} cursor-pointer`} onClick={onClick}>
        {/* <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${checked ? 'bg-primary border-primary' : 'border-gray-300'}`}>
          {checked && <Check size={16} className="text-white" />}
          <RadioGroup>
            <RadioGroupItem value="option-four" checked={checked} id="option-four" />
          </RadioGroup>
        </div> */}
        <RadioGroup>
            <RadioGroupItem value="option-four" checked={checked} id="option-four" className={` ${checked ? 'bg-white text-white':''}`} />
          </RadioGroup>
        <div className="flex items-center text-gray-700">
          {/* {icon} */}
          <span className={`ml-2 flex whitespace-nowrap text-sm font-bold font-['Inter'] ${checked ? 'text-white':'text-black'}`}>{label}</span>
        </div>
      </div>
    );
  };
  



  export default CourseContent