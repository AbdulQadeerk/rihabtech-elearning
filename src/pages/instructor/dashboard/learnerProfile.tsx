import { Button } from "../../../components/ui/button";
import GradientHeader from "../../../components/ui/GradientHeader";

export const LearnerProfile = () => {
  return (
    <div className="public-profile-root min-h-screen bg-white">
      <GradientHeader subtitle="Learner" title="Learner Profile" />
      <div className="public-profile-content">
        <div className="public-profile-card-wrapper">
          <div className="public-profile-card">
            <div className="public-profile-initials">--</div>
            <Button className="rounded-none">Send Message</Button>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="justify-start text-[#383e49] text-[25px] font-semibold font-['Inter'] leading-[37.50px] mt-12">
          Courses Enrolled
        </div>
        <div className="text-center py-12 text-gray-500">
          No enrolled courses to display.
        </div>
      </div>
    </div>
  );
};
