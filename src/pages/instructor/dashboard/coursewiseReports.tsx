import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "../../../components/ui/table";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useEffect, useState } from "react";
import { ChevronDown, BarChart3, TrendingUp, DollarSign, Users, BookOpen, Clock, RefreshCw } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useAuth } from "../../../context/AuthContext";
import { getInstructorCourses, InstructorCourse } from "../../../utils/firebaseInstructorCourses";
import { CourseDisplayData } from "../course/courseList";
import RevenueReport from "./revenueReport";
import courseAnalyticsService, { 
  CourseAnalyticsData, 
  CourseRevenueBreakdown, 
  CourseRevenueItem 
} from "../../../utils/courseAnalyticsService";

type TabOption = 'revenue-report' | 'course-analytics';

export const CourseWiseReports = () =>{
    const [activeTab, setActiveTab] = useState<TabOption>('revenue-report');
    const { user } = useAuth();
    
    // Course Analytics state
    const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalyticsData[]>([]);
    const [revenueBreakdown, setRevenueBreakdown] = useState<CourseRevenueBreakdown[]>([]);
    const [revenueList, setRevenueList] = useState<CourseRevenueItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCourseForAnalytics, setSelectedCourseForAnalytics] = useState<string>("all");
    
    const instructorId = user?.UserName || user?.email || 'abdulquader152@gmail.com';
    
    // Load course analytics data
    useEffect(() => {
        if (activeTab === 'course-analytics') {
            loadCourseAnalytics();
        }
    }, [activeTab, selectedCourseForAnalytics, instructorId]);
    
    const loadCourseAnalytics = async () => {
        try {
            setLoading(true);
            console.log('Loading course analytics for instructor:', instructorId);
            
            try {
                // Fetch real data from Firebase
                const [analytics, breakdown, list] = await Promise.all([
                    courseAnalyticsService.getCourseAnalytics(instructorId),
                    courseAnalyticsService.getCourseRevenueBreakdown(instructorId, selectedCourseForAnalytics),
                    courseAnalyticsService.getCourseRevenueList(instructorId, selectedCourseForAnalytics)
                ]);
                
                console.log('Course analytics data fetched:');
                console.log('Analytics:', analytics.length);
                console.log('Breakdown:', breakdown);
                console.log('Revenue List:', list.length);
                
                setCourseAnalytics(analytics);
                setRevenueBreakdown(breakdown);
                setRevenueList(list);
                
            } catch (firebaseError) {
                console.warn('Firebase data not available, using mock data:', firebaseError);
                
                // Fallback to mock data
                const mockAnalytics = courseAnalyticsService.getMockCourseAnalytics();
                const mockBreakdown = courseAnalyticsService.getMockRevenueBreakdown();
                const mockList = courseAnalyticsService.getMockRevenueList();
                
                setCourseAnalytics(mockAnalytics);
                setRevenueBreakdown(mockBreakdown);
                setRevenueList(mockList);
            }
        } catch (error) {
            console.error('Error loading course analytics:', error);
        } finally {
            setLoading(false);
        }
    };
    return(
        <div className="p-6">
        <div className="flex items-center mb-6">
          <h1 className="form-title mr-6">Revenue Report</h1>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button
                onClick={() => setActiveTab('revenue-report')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'revenue-report'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                }`}
            >
                <div className="mr-2" >₹</div>
                Revenue Report
            </button>
            <button
                onClick={() => setActiveTab('course-analytics')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'course-analytics'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                }`}
            >
                <BarChart3 className="w-4 h-4 mr-2" />
                Course Analytics
            </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'revenue-report' && (
            <RevenueReport />
        )}
        
        {activeTab === 'course-analytics' && (
            <>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center space-x-2">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                            <span>Loading course analytics...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-50 p-6 flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6">
                            <div className="flex-1">
                                <RevenueCard 
                                    title="All Courses" 
                                    data={revenueBreakdown} 
                                    showDropdown={true}
                                    showLegend={true}
                                    selectedCourse={selectedCourseForAnalytics}
                                    onCourseChange={setSelectedCourseForAnalytics}
                                    courses={courseAnalytics}
                                    totalRevenue={revenueBreakdown.reduce((sum, item) => sum + item.amount, 0)}
                                />
                            </div>
                        </div>
                        
                        <div className="p-4 mt-4">
                            <h1 className="py-2 text-[#414d55] text-base font-medium font-['Poppins'] leading-tight tracking-tight">Revenue List</h1>
                            <Table className="border">
                                <TableHeader className="ins-table-header">
                                    <TableRow className="table-head-text">
                                        <TableHead>Sr. No.</TableHead>
                                        <TableHead>Course Name</TableHead>
                                        {/* <TableHead>Tax Amount</TableHead>
                                        <TableHead>Platform Charges</TableHead> */}
                                        <TableHead>Net Earning</TableHead>
                                        <TableHead>Total Watch time</TableHead>
                                        <TableHead>Students</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {revenueList.length > 0 ? (
                                        revenueList.map((row, index) => (
                                            <TableRow key={index} className="ins-table-row">
                                                <TableCell className="table-body-text">{row.srNo}</TableCell>
                                                <TableCell className="table-body-text">{row.courseName}</TableCell>
                                                {/* <TableCell className="table-body-text">₹{row.taxAmount.toLocaleString()}</TableCell>
                                                <TableCell className="table-body-text">₹{row.platformCharges.toLocaleString()}</TableCell> */}
                                                <TableCell className="table-body-text">₹{row.netEarning.toLocaleString()}</TableCell>
                                                <TableCell className="table-body-text">{row.totalWatchTime} Min</TableCell>
                                                <TableCell className="table-body-text">{row.studentCount}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                No revenue data available
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </>
        )}
        </div>
    )
  }



  // Revenue card component that displays a donut chart with details
interface RevenueCardProps {
  title: string;
  data: CourseRevenueBreakdown[];
  showDropdown?: boolean;
  showLegend?: boolean;
  selectedCourse?: string;
  onCourseChange?: (courseId: string) => void;
  courses?: CourseAnalyticsData[];
  totalRevenue?: number;
}

const RevenueCard = ({ 
  title, 
  data, 
  showDropdown = false, 
  showLegend = false, 
  selectedCourse = "all",
  onCourseChange,
  courses = [],
  totalRevenue = 0
}: RevenueCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 h-full">
        {showDropdown && (
          <div className="w-64 mb-4">
            <Select value={selectedCourse} onValueChange={onCourseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a Course" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.courseId} value={course.courseId}>
                    {course.courseTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center flex-grow">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  cornerRadius={40}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} radius={20} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                {title === "All Courses" ? "Life Time Revenue" : 
                 "Your Earning By Courses"}
              </p>
            </div>
          </div>
          
          {showLegend && (
            <div className="mt-6 w-full">
              {data.filter(item => item.name !== 'Empty').map((item, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="text-[#787878] text-xs font-medium font-['Inter']">{item.name}</span>
                  </div>
                  <span className={`text-sm font-medium ${item.name === 'Refunds' ? 'text-red-600' : 'text-gray-900'}`}>
                    ₹{item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };