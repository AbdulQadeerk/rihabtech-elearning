import { Button } from "../../../../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../../../../components/ui/radio";

const CourseSpend = () => {
    return (
        <div className="flex flex-col justify-between h-full">
      <div className="p-8">
        <h1 className="ins-heading mb-3">How much time can you spend creating your course?</h1>
        <p className="justify-start text-[#1e1e1e] text-sm font-medium font-['Nunito']">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse laoreet, nulla vitae ultrices iaculis, tortor lorem maximus sem, eu luctus orci dui id sem.</p>
        <div className="mt-8">
        <RadioGroup defaultValue="option-one" className="grid grid-cols-2">
  <div className="flex items-center space-x-2 ins-control-border px-2">
    <RadioGroupItem value="option-one" id="option-one" />
    <label htmlFor="option-one">Busy Right Now (2 - 5 Hrs)</label>
  </div>
  <div className="flex items-center space-x-2 ins-control-border px-2">
    <RadioGroupItem value="option-two" id="option-two" />
    <label htmlFor="option-two">Busy Right Now (4 - 6 Hrs)</label>
  </div>
  <div className="flex items-center space-x-2 ins-control-border px-2">
    <RadioGroupItem value="option-three" id="option-three" />
    <label htmlFor="option-three">Busy Right Now (6+ Hrs)</label>
  </div>
  <div className="flex items-center space-x-2 ins-control-border px-2">
    <RadioGroupItem value="option-four" id="option-four" />
    <label htmlFor="option-four">Busy Right Now</label>
  </div>
</RadioGroup>

        </div>
        
      </div>
      <div className="flex justify-between w-full items-center rounded-md border border-gray p-4">
        <Button variant={'outline'} className="rounded-none" onClick={()=>{window.location.hash='#/instructor/course-category'}}>Previous</Button>
            <Button className="rounded-none" onClick={()=>{window.location.hash='#/instructor/course-sections'}}>Continue</Button>
        </div>
      </div>
    );
  };


  export default CourseSpend