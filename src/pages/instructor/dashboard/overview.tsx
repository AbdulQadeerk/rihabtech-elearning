import { BarChart2, Calendar, ChevronDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "../../../components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "../../../components/ui/table";
import { MouseEventHandler, useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../../components/ui/select";
import { useAuth } from "../../../context/AuthContext";
import { dashboardService, DashboardStats, RevenueData } from "../../../utils/dashboardService";
import { CourseDisplayData } from "../course/courseList";
import { getInstructorCourses } from "../../../utils/firebaseInstructorCourses";
import { format } from "date-fns";
import apiService from "../../../utils/apiService";
import { API_BASE_URL } from "../../../lib/api";
import courseWatchTimeService, { CourseWatchTimeData } from "../../../utils/courseWatchTimeService";
import { useNavigate } from "react-router-dom";

// Monthly Revenue Summary interface matching API response
interface MonthlyRevenueSummary {
  month: string;
  year: number;
  totalRevenue: number;
  totalTax: number;
  totalPlatformFee: number;
  totalInstructorShare: number;
  subscriptionRevenue: number;
  courseRevenue: number;
  withoutHoldingTax: number;
  processedDate: Date | null;
  breakdown: any[];
  watchMinutes: number;
  totalWatchTime: number;
}

export const Overview = () =>{
    const navigate = useNavigate();
    const [revenueMonthly, setRevenueMonthly] = useState<MonthlyRevenueSummary[]>([]);
    const [showmonthWiseReport, setShowMonthWiseReport] = useState(false);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [revenueStats, setRevenueStats] = useState<RevenueData[]>([]);
    const [courses, setCourses] = useState<CourseDisplayData[]>([]);
    const [courseWatchTimeData, setCourseWatchTimeData] = useState<CourseWatchTimeData[]>([]);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

    const [selectedCourse, setSelectedCourse] = useState<string >('all-courses');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Format watch time function
    const formatWatchTime = (minutes: number): string => {
        if (minutes < 60) {
            return `${Math.round(minutes)} Min`;
        } else if (minutes < 1440) { // Less than 24 hours
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = Math.round(minutes % 60);
            return `${hours}h ${remainingMinutes}m`;
        } else {
            const days = Math.floor(minutes / 1440);
            const remainingHours = Math.floor((minutes % 1440) / 60);
            return `${days}d ${remainingHours}h`;
        }
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            const instructorId = user?.UserName || user?.email; // Fallback for testing
            if (!instructorId) {
                console.log("No user UserName or email found:", user);
                return;
            }
            
            console.log("Loading dashboard data for instructor:", instructorId);
            
            try {
                setLoading(true);
                const [stats, revenue, watchTimeData] = await Promise.all([
                    dashboardService.getDashboardStats(instructorId,selectedCourse==='all-courses'?null:selectedCourse),
                    dashboardService.getRevenueStatistics(instructorId, new Date().getFullYear()),
                    courseWatchTimeService.getCourseWatchTimeData(instructorId)
                ]);

                const revenueWithMonthNames = revenue.map((item) => ({
                ...item,
                month: monthNames[parseInt(item.month, 10) - 1],
                }));
              setDashboardStats(stats);
              setRevenueStats(revenueWithMonthNames);
              setCourseWatchTimeData(watchTimeData);
              console.log("Course watch time data loaded:", watchTimeData);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                // Fallback to mock data
                setDashboardStats(dashboardService.getMockDashboardStats());
                setRevenueStats([
                    { month: 'May', revenue: 8000, enrollments: 0, percentage: 80 },
                    { month: 'Jun', revenue: 6500, enrollments: 0, percentage: 65 },
                    { month: 'Jul', revenue: 8000, enrollments: 0, percentage: 80 },
                    { month: 'Aug', revenue: 5000, enrollments: 0, percentage: 50 },
                    { month: 'Sep', revenue: 10000, enrollments: 0, percentage: 100 },
                    { month: 'Oct', revenue: 7500, enrollments: 0, percentage: 75 },
                    { month: 'Nov', revenue: 7500, enrollments: 0, percentage: 75 },
                    { month: 'Dec', revenue: 7500, enrollments: 0, percentage: 75 },
                    { month: 'Jan', revenue: 8000, enrollments: 0, percentage: 80 },
                    { month: 'Feb', revenue: 7000, enrollments: 0, percentage: 70 }
                ]);
            } finally {
                setLoading(false);
            }
        };

        const fetchInstructorCourses = async () => {
                try {
                    setLoading(true);
                    
                    const instructorId = user?.UserName || user?.email || 'abdulquader152@gmail.com'; // Fallback for testing
                    if (!instructorId) {
                        console.log("No user email found");
                        return;
                    }
        
                    console.log("Fetching courses for instructor:", instructorId);
                    const instructorCourses = await getInstructorCourses(instructorId);
                    
                    // Transform Firebase data to match the UI structure
                    const transformedCourses: CourseDisplayData[] = instructorCourses.map(course => ({
                        ...course,
                        // Use real data from Firestore or fallback to calculated values
                        earnings: course.members?.length ? course.members.length * 100 : 0, // Calculate based on members
                        enrollments: course.members?.length || 0, // Use actual member count
                        ratings: course.members?.length ? Math.floor(course.members.length * 0.8) : 0, // Calculate based on members
                        ratingScore: 4.5 // Default rating, can be enhanced with real review data
                    }));
                    
                    console.log("Transformed courses:", transformedCourses);
                    setCourses(transformedCourses);
        
                } catch (err) {
                    console.error("Error fetching courses:", err);
                    
                } finally {
                    setLoading(false);
                }
            };

            const loadMonthlyRevenueData = async () => {
            try {
                setLoading(true);
                const currentYear = new Date().getFullYear();
                console.log("Loading monthly revenue data for year:", currentYear);
                
                // Call the new API endpoint
                const monthlyRevenueData = await apiService.get<Array<{
                    month: string;
                    year: number;
                    totalRevenue: number;
                    totalTax: number;
                    totalPlatformFee: number;
                    totalInstructorShare: number;
                    totalWatchTime: number;
                    processedDate: string | null;
                }>>(
                    `${API_BASE_URL}instructor/dashboard/monthly-revenue`,
                    { year: currentYear }
                );
                
                console.log("Monthly Revenue Data from API:", monthlyRevenueData);
                
                // Transform API data to match the expected format
                const transformedData = monthlyRevenueData.map(item => ({
                    month: item.month,
                    year: item.year,
                    totalRevenue: item.totalRevenue || 0,
                    totalTax: item.totalTax || 0,
                    totalPlatformFee: item.totalPlatformFee || 0,
                    totalInstructorShare: item.totalInstructorShare || 0,
                    subscriptionRevenue: 0,
                    courseRevenue: 0,
                    withoutHoldingTax: item.totalInstructorShare || 0,
                    processedDate: item.processedDate ? new Date(item.processedDate) : null,
                    breakdown: [],
                    watchMinutes: item.totalWatchTime || 0,
                    totalWatchTime: item.totalWatchTime || 0
                }));
                
                console.log("Transformed monthly revenue data:", transformedData);
                setRevenueMonthly(transformedData);
            } catch (error) {
                console.error("Error loading monthly revenue data:", error);
                // Create empty 12 months on error
                const currentYear = new Date().getFullYear();
                const emptyMonths = [];
                for (let i = 1; i <= 12; i++) {
                    const nextMonth = i === 12 ? 1 : i + 1;
                    const nextYear = i === 12 ? currentYear + 1 : currentYear;
                    const expectedPayoutDate = new Date(nextYear, nextMonth - 1, 15);
                    
                    emptyMonths.push({
                        month: `${currentYear}-${i.toString().padStart(2, '0')}`,
                        year: currentYear,
                        totalRevenue: 0,
                        totalTax: 0,
                        totalPlatformFee: 0,
                        totalInstructorShare: 0,
                        subscriptionRevenue: 0,
                        courseRevenue: 0,
                        withoutHoldingTax: 0,
                        processedDate: expectedPayoutDate,
                        breakdown: [],
                        watchMinutes: 0,
                        totalWatchTime: 0
                    });
                }
                setRevenueMonthly(emptyMonths);
            } finally {
                setLoading(false);
            }
        };
      loadMonthlyRevenueData();
      fetchInstructorCourses();
      loadDashboardData();
        
    }, [user?.UserName]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <img src="/icons/loader.gif" alt="Loading..." className="w-16 h-16 mb-4" />
                <p className="text-gray-600">Loading dashboard data...</p>
            </div>
        );
    }

    return(
        <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            {/* <Select onValueChange={(value) => setSelectedCourse(value)} value={selectedCourse || "all-courses"}>
            <SelectTrigger className="form-title mr-2 border-none shadow-none outline-none truncate max-w-lg">{selectedCourse
      ? courses.find((c) => c.id === selectedCourse)?.title || "All Courses"
      : "All Courses"}</SelectTrigger>
            <SelectContent>
              <SelectItem value='all-courses' className="cursor-pointer">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id} className="cursor-pointer">
                  {course.title.length > 30 ? course.title.substring(0, 30) + "..." : course.title}
                </SelectItem>
              ))}
            </SelectContent>
            </Select> */}
            {/* <ChevronDown size={20} className="text-gray-500" /> */}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <StatsCard 
            title="Total Watch Time" 
            value={dashboardStats?.totalWatchtime ? `${dashboardStats.totalWatchtime.toLocaleString()} Min` : '0 Min'}
            growth={dashboardStats?.totalCourses.toString() || '0'}
            period="Total Courses" 
          />
          <StatsCard 
            title="Total Revenue" 
            value={`₹${dashboardStats?.totalRevenue.toLocaleString() || '0'}`}
            growth={dashboardStats?.currentMonthRevenue.toLocaleString() || '0'}
            period="This Month" 
          />
          <StatsCard 
            title="Total Enrollment" 
            value={dashboardStats?.totalEnrollments.toLocaleString() || '0'}
            growth={dashboardStats?.currentMonthEnrollments.toLocaleString() || '0'}
            period="This Month" 
          />
          <StatsCard 
            title="Total Students" 
            value={dashboardStats?.totalStudents.toLocaleString() || '0'}
            growth={dashboardStats?.totalCourses.toString() || '0'}
            period="Total Courses" 
          />
        </div>
        <RevenueChart data={revenueStats} onClick={() => setShowMonthWiseReport((prev) => !prev)}/>
        {showmonthWiseReport&&
            <MonthWiseReports data={revenueMonthly}/>
        }
        
        {/* Course-wise Watch Time Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course-wise Watch Time</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Watch Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatWatchTime(courseWatchTimeData.reduce((sum, course) => sum + course.totalWatchTime, 0))}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {courseWatchTimeData.reduce((sum, course) => sum + course.totalStudents, 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg. Watch Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatWatchTime(
                        courseWatchTimeData.reduce((sum, course) => sum + course.totalStudents, 0) > 0
                          ? courseWatchTimeData.reduce((sum, course) => sum + course.totalWatchTime, 0) / 
                            courseWatchTimeData.reduce((sum, course) => sum + course.totalStudents, 0)
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{courseWatchTimeData.length}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Watch Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Watch Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Accessed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courseWatchTimeData.map((course) => (
                    <tr key={course.courseId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.courseTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">{formatWatchTime(course.totalWatchTime)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.totalStudents}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatWatchTime(course.averageWatchTime)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${course.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{Math.round(course.completionRate)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {course.lastAccessed.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    )
}

interface StatsCardProps {
  title: string;
  value: string;
  growth: string;
  period: string;
}

const StatsCard = ({ title, value, growth, period }: StatsCardProps) => {
    return (
      <div className="p-4 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)] shadow-md flex-1">
        <h3 className="text-black text-xl font-normal font-['Inter'] leading-[30px] mb-2">{title}</h3>
        <div className="flex justify-between items-start">
          <div>
            
            <p className=" text-primary text-[27px] font-semibold font-['Inter'] leading-10">{value}</p>
          </div>
          {/* <div className="text-right">
            <p className="text-primary text-[15px] font-semibold font-['Inter'] leading-snug">{growth}</p>
            <p className="text-black text-[10px] font-semibold font-['Inter'] leading-[15px]">{period}</p>
          </div> */}
        </div>
      </div>
    );
  };


  interface RevenueChartProps {
      onClick: () => void;
      data: RevenueData[];
    }

  const RevenueChart = ({ onClick, data }: RevenueChartProps) => {
    const chartData = data.map(item => ({
      month: item.month,
      value: item.revenue
    }));
  
    return (
      <div className="p-4 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)] mt-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-gray-700 font-medium">Revenue Statistics</h2>
          <div className="flex items-center border border-gray-300 rounded-md px-2 py-1">
          <Calendar size={16} className="text-gray-500  mr-2" />
            <span className="text-sm text-gray-600">Monthly</span>
            
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={25} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis
              dataKey="revenue"
                axisLine={false}
                tickLine={false}
                ticks={[0, 2500, 5000, 7500, 10000]}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />
              <CartesianGrid vertical={false} color="#bbb" strokeDasharray="0" />
              <Bar dataKey="value" fill="#FF6B00" width={0.20} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-left mt-4">
          <Button className=" text-sm font-medium" onClick={onClick}>
            Check Revenue Report
          </Button>
        </div>
      </div>
    );
  };


  const MonthWiseReports = ({data}:any) =>{

    console.log("Monthly Revenue Data in Report Component:", data);
    console.log("Number of months received:", data?.length);

    if (!data || data.length === 0) {
      return (
        <div className="p-4 mt-4">
          <h1 className="py-2 text-[#414d55] text-base font-medium font-['Poppins'] leading-tight tracking-tight">Month Wise Report</h1>
          <div className="text-center py-8 text-gray-500">
            No revenue data available for the selected period.
          </div>
        </div>
      );
    }

      const tableData = data.map((row:any) => {
      console.log("Processing row:", row);
    const [year, month] = row?.month?.split("-");
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("default", {
      month: "long",
    });

      console.log(`Month: ${row?.month}, Year: ${year}, Month: ${month}, MonthName: ${monthName}`);

    return {
      month: `${monthName} ${year}`,
        preTax: row.totalRevenue || 0,         // Pre-Tax Amount
        withoutHolding: row.withoutHoldingTax || 0,        // Without Holding Tax
        netEarning: row.totalInstructorShare || 0,   // Net Earning
        watchTime: row.totalWatchTime || 0,    // Total Watch Time
      payoutDate: row.processedDate
        ? format(
            row.processedDate.toDate ? row.processedDate.toDate() : row.processedDate,
            "dd MMM yyyy"
          )
        : "N/A",
    };
  });

    console.log("Table data after processing:", tableData);
    console.log("Months in table data:", tableData.map((t: any) => t.month));

    // Calculate totals
    const totals = tableData.reduce((acc: any, row: any) => ({
      preTax: acc.preTax + row.preTax,
      withoutHolding: acc.withoutHolding + row.withoutHolding,
      netEarning: acc.netEarning + row.netEarning,
      watchTime: acc.watchTime + row.watchTime,
    }), { preTax: 0, withoutHolding: 0, netEarning: 0, watchTime: 0 });
   
    return(
        <div className="p-4 mt-4">
            <h1 className="py-2 text-[#414d55] text-base font-medium font-['Poppins'] leading-tight tracking-tight">Month Wise Report</h1>
            <Table className="border">
          <TableHeader className="ins-table-header">
          <TableRow className="table-head-text">
            <TableHead>Time Period</TableHead>
            {/* <TableHead>Pre Tax Amount</TableHead>
            <TableHead>Without Holding Tax</TableHead> */}
            <TableHead>Net Earning</TableHead>
            <TableHead>Watch Time (Min)</TableHead>
            <TableHead>Expected Payout Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((row:any, index:number) => (
            <TableRow
              key={index}
              className="ins-table-row"
              // onClick={() => {
              //   window.location.hash = "#/instructor/monthly-revenue";
              // }}
            >
              <TableCell className="table-body-text">{row.month}</TableCell>
              {/* <TableCell className="table-body-text">₹{row.preTax.toLocaleString()}</TableCell>
              <TableCell className="table-body-text">₹{row.withoutHolding.toLocaleString()}</TableCell> */}
              <TableCell className="table-body-text">₹{row.netEarning.toLocaleString()}</TableCell>
              <TableCell className="table-body-text">{row.watchTime.toLocaleString()}</TableCell>
              <TableCell className="table-body-text">{row.payoutDate}</TableCell>
            </TableRow>
          ))}
          {/* Totals Row */}
          <TableRow className="ins-table-row font-semibold bg-gray-50">
            <TableCell className="table-body-text">Total</TableCell>
            {/* <TableCell className="table-body-text">₹{totals.preTax.toLocaleString()}</TableCell>
            <TableCell className="table-body-text">₹{totals.withoutHolding.toLocaleString()}</TableCell> */}
            <TableCell className="table-body-text">₹{totals.netEarning.toLocaleString()}</TableCell>
            <TableCell className="table-body-text">{totals.watchTime.toLocaleString()}</TableCell>
            <TableCell className="table-body-text">-</TableCell>
          </TableRow>
        </TableBody>
        </Table>
        </div>
    )
  }