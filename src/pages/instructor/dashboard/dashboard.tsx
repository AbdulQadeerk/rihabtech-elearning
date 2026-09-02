import { useState } from "react";
import { Overview } from "./overview";
import { Students } from "./students";
import Reviews from "./reviews";
import { CourseWiseReports } from "./coursewiseReports";
import { Engagment } from "./engagment";
import { BarChart3, TrendingUp, Users, BookOpen, Star } from "lucide-react";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("overview");

    const tabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "engagement", label: "Engagement", icon: TrendingUp },
        { id: "students", label: "Students", icon: Users },
        { id: "courses", label: "Courses", icon: BookOpen },
        { id: "reviews", label: "Reviews", icon: Star }
    ];

    return (
        <div className="flex flex-col min-h-screen p-4 md:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Performance & Analytics</h1>
                <p className="text-sm text-gray-500">Track your watch time, learner engagement, course metrics, and revenue</p>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto pb-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-150 ${
                                    isActive
                                        ? 'border-primary text-primary font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Tab Content */}
            <div className="flex-1 w-full min-w-0">
                {activeTab === "overview" && <Overview />}
                {activeTab === "engagement" && <Engagment />}
                {activeTab === "courses" && <CourseWiseReports />}
                {activeTab === "students" && <Students />}
                {activeTab === "reviews" && <Reviews />}
            </div>
        </div>
    );
}
