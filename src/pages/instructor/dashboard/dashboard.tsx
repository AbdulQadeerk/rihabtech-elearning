import { useState } from "react";
import { Overview } from "./overview";
import { Students } from "./students";
import Reviews from "./reviews";
import { CourseWiseReports } from "./coursewiseReports";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("overview");

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "students", label: "Students" },
        { id: "courses", label: "Courses" },
        { id: "reviews", label: "Reviews" }
    ];

    return (
        <div className="flex flex-col md:flex-row h-full p-4 md:p-6">

            <div className="w-full md:w-64 flex flex-row md:flex-col border-r border-gray-200 pr-6 overflow-x-scroll md:overflow-x-auto">
                {tabs.map((tab) => (
                    <NavTab
                        key={tab.id}
                        label={tab.label}
                        active={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                    />
                ))}
            </div>
            <div className="flex-col md:flex-1 p-0 md:pl-6">
                {activeTab === "overview" && (
                    <div>
                        <Overview />
                    </div>
                )}
                {
                    activeTab === "courses" && (
                        <CourseWiseReports />
                    )
                }
                {
                    activeTab === "students" && (
                        <Students />
                    )
                }
                {
                    activeTab === "reviews" && (
                        <div>
                            <Reviews />
                        </div>
                    )
                }

            </div>

        </div>
    );
};

const NavTab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => {
    return (
        <div className={`mb-4 flex items-center cursor-pointer p-2 ${active ? 'bg-primary rounded-[7px] ' : 'bg-transparent'}`} onClick={onClick}>

            <div className="flex items-center text-gray-700">
                {/* {icon} */}
                <span className={`ml-2 text-xs font-semibold font-['Inter'] ${active ? 'text-white' : 'text-black'}`}>{label}</span>
            </div>
        </div>
    );
};
