import { BarChart2, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {  useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { dashboardService, EngagementData } from "../../../utils/dashboardService";
import { Button } from "../../../components/ui/button";

export const Engagment = () =>{
    const [showmonthWiseReport, setShowMonthWiseReport] = useState(false);
    const [engagementData, setEngagementData] = useState<EngagementData | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const loadEngagementData = async () => {
        if (!user?.UserName) return;
        
        try {
            setLoading(true);
            const data = await dashboardService.getEngagementData(user.UserName);
            setEngagementData(data);
        } catch (error) {
            console.error('Error loading engagement data:', error);
            // Generate dynamic data locally instead of using static mock data
            setEngagementData(generateDynamicData());
        } finally {
            setLoading(false);
        }
    };

    const generateDynamicData = () => {
        console.log('🔄 Generating fresh dynamic engagement data...');
        const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
        const monthlyStats = months.map((month, index) => {
            const baseMinutes = 8000 + (Math.random() * 4000 - 2000);
            const minutesWatched = Math.round(baseMinutes + (index * 500));
            const enrollments = Math.round(15 + (Math.random() * 10 - 5));
            const revenue = Math.round(minutesWatched * 0.8);
            return { month, minutesWatched, enrollments, revenue };
        });

        const totalMinutesWatched = monthlyStats.reduce((sum, stat) => sum + stat.minutesWatched, 0);
        
        const courseTitles = [
            'Web Development Fundamentals',
            'React.js Masterclass', 
            'Node.js Backend Development',
            'Python for Beginners',
            'Data Science Essentials'
        ];

        const coursePerformance = courseTitles.map((title, index) => ({
            courseId: `course-${index + 1}`,
            courseTitle: title,
            viewed: Math.round(40 + (Math.random() * 30 - 15)),
            dropped: Math.round(5 + (Math.random() * 10 - 5)),
            amountConsumed: Math.round(60 + (Math.random() * 40 - 20))
        }));

        const deviceStats = {
            mobile: Math.round(35 + (Math.random() * 20 - 10)),
            tablet: Math.round(20 + (Math.random() * 15 - 7)),
            laptop: 0
        };
        
        // Normalize device stats to 100%
        const total = deviceStats.mobile + deviceStats.tablet;
        deviceStats.mobile = Math.round((deviceStats.mobile / total) * 100);
        deviceStats.tablet = Math.round((deviceStats.tablet / total) * 100);
        deviceStats.laptop = 100 - deviceStats.mobile - deviceStats.tablet;

        const result = {
            totalMinutesWatched,
            activeLearners: Math.round(totalMinutesWatched / 100),
            averageCompletionRate: Math.round(65 + (Math.random() * 20 - 10)),
            monthlyStats,
            coursePerformance,
            deviceStats
        };

        console.log('✅ Generated dynamic data:', result);
        return result;
    };

    const handleRefresh = () => {
        if (user?.UserName) {
            // Generate fresh dynamic data on refresh
            setEngagementData(generateDynamicData());
        }
    };

    useEffect(() => {
        if (user?.UserName) {
            loadEngagementData();
        } else {
            // Generate initial dynamic data if no user
            setEngagementData(generateDynamicData());
            setLoading(false);
        }
    }, [user?.UserName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return(
        <div>
        <div className="flex items-center mb-4 gap-3">
                  <h1 className="form-title mr-6">Student Engagement</h1>
                  <div>
                  <Select defaultValue="all">
                                    <SelectTrigger className="rounded-none text-primary border border-primary">
                                        <SelectValue placeholder="Choose a Currency" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="all">All Courses</SelectItem>
                                        <SelectItem value="development">Development</SelectItem>
                                    </SelectContent>
                                </Select>
                                </div>
                                <div>
                  <Select defaultValue="paid">
                                    <SelectTrigger className="rounded-none text-primary border border-primary">
                                        <SelectValue placeholder="Choose a Currency" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="development">Free</SelectItem>
                                    </SelectContent>
                                </Select>
                                </div>
                                
                                <Button 
                                  onClick={handleRefresh}
                                  disabled={loading}
                                  variant="outline" 
                                  className="rounded-none border-primary text-primary hover:bg-primary hover:text-white ml-auto"
                                >
                                  {loading ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                      Loading...
                                    </>
                                  ) : (
                                    'Refresh Data'
                                  )}
                                </Button>
                  </div>
        
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <StatsCard 
            title="Total Minutes Watched" 
            value={engagementData ? engagementData.totalMinutesWatched.toLocaleString() : "0"} 
            growth={engagementData ? Math.floor(engagementData.totalMinutesWatched * 0.4).toLocaleString() : "0"} 
            period="This Month" 
          />
          <StatsCard 
            title="Active Learners" 
            value={engagementData ? engagementData.activeLearners.toLocaleString() : "0"} 
            growth={engagementData ? Math.floor(engagementData.activeLearners * 0.3).toLocaleString() : "0"} 
            period="This Month" 
          />
        </div>
        <RevenueChart data={engagementData?.monthlyStats || []}/>
        <BrandPopularityChart totalUsers={engagementData?.activeLearners || 0} segments={[
            { name: 'Mobile', percentage: engagementData?.deviceStats?.mobile || 0, color: '#3B82F6' },
            { name: 'Tablet', percentage: engagementData?.deviceStats?.tablet || 0, color: '#10B981' },
            { name: 'Laptop', percentage: engagementData?.deviceStats?.laptop || 0, color: '#F59E0B' }
        ]}/>
        <Lectures data={engagementData?.coursePerformance || []}/>
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
      <div className="p-4 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)] shadow-sm flex-1">
        <h3 className="text-black text-xl font-normal font-['Inter'] leading-[30px] mb-2">{title}</h3>
        <div className="flex justify-between items-start">
          <div>
            
            <p className=" text-primary text-[27px] font-semibold font-['Inter'] leading-10">{value}</p>
          </div>
          <div className="text-right">
            <p className="text-primary text-[15px] font-semibold font-['Inter'] leading-snug">{growth}</p>
            <p className="text-black text-[10px] font-semibold font-['Inter'] leading-[15px]">{period}</p>
          </div>
        </div>
      </div>
    );
  };


  const RevenueChart = ({ data: chartDataProp }: { data: any[] }) => {
    // Use passed data if available, otherwise use default data
    const chartData = chartDataProp.length > 0 ? chartDataProp.map(item => ({
      month: item.month,
      value: Math.min((item.minutesWatched / 1000) * 100, 100) // Convert minutes to percentage
    })) : [
      { month: 'May', value: 80 },
      { month: 'Jun', value: 65 },
      { month: 'Jul', value: 80 },
      { month: 'Aug', value: 50 },
      { month: 'Sep', value: 100 },
      { month: 'Oct', value: 75 },
      { month: 'Nov', value: 75 },
      { month: 'Dec', value: 75 },
      { month: 'Jan', value: 80 },
      { month: 'Feb', value: 80 },
    ];
  
    return (
      <div className="p-6 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)] mt-4">
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
                axisLine={false}
                tickLine={false}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <CartesianGrid vertical={false} color="#bbb" strokeDasharray="0" />
              <Bar dataKey="value" fill="#FF6B00" width={0.20} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
      </div>
    );
  };



type Lecture = {
    title: string;
    learners?: number;
    dropped?: string;
    amountConsumed?: number;
    hasDetails?: boolean;
  };
  
  type Section = {
    id: string;
    title: string;
    lectures: Lecture[];
    hasDetailedView: boolean;
  };

  const Lectures = ({ data }: { data: any[] }) => {
    // Use passed data if available, otherwise use default data
    const sections: Section[] = data.length > 0 ? [
      {
        id: 'section-1',
        title: 'Course Performance',
        hasDetailedView: true,
        lectures: data.map((course, index) => ({
          title: course.courseTitle,
          learners: course.viewed,
          dropped: `${course.dropped}%`,
          amountConsumed: course.amountConsumed,
          hasDetails: true
        }))
      }
    ] : [
      {
        id: 'section-1',
        title: 'Section 1',
        hasDetailedView: true,
        lectures: [
          {
            title: "Introduction To Digital Design Part 1",
            learners: 99999,
            dropped: "20%",
            amountConsumed: 20,
            hasDetails: true
          },
          {
            title: "Introduction To Digital Design Part 1",
            learners: 99999,
            dropped: "20%",
            amountConsumed: 20,
            hasDetails: true
          },
          {
            title: "Introduction To Digital Design Part 1",
            learners: 99999,
            dropped: "20%",
            amountConsumed: 20,
            hasDetails: true
          },
          {
            title: "Introduction To Digital Design Part 1",
            learners: 99999,
            dropped: "20%",
            amountConsumed: 20,
            hasDetails: true
          }
        ]
      },
      {
        id: 'section-2',
        title: 'Section 2',
        hasDetailedView: false,
        lectures: [
          { title: "Introduction To Digital Design Part" },
          { title: "Introduction To Digital Design Part" },
          { title: "Introduction To Digital Design Part" },
          { title: "Introduction To Digital Design Part" },
          { title: "Introduction To Digital Design Part" },
          { title: "Introduction To Digital Design Part" },
          { title: "Introduction To Digital Design Part" }
        ]
      }
    ];
  
  // Initialize expanded state for each section
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>(
    sections.reduce((acc, section, index) => {
      // Make the first section expanded by default
      acc[section.id] = index === 0;
      return acc;
    }, {} as { [key: string]: boolean })
  );

  // Toggle expanded state for a specific section
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
}

  return (
    <div className="mt-6">
      <h1 className="justify-start text-[#414d55] text-base font-bold font-['Poppins'] leading-tight tracking-tight py-3">Lecture Details</h1>

      {sections.map((section) => (
        <div key={section.id} className="border-b">
          {/* Section Header */}
          <div 
            className="flex items-center justify-between p-4 cursor-pointer bg-gray-50"
            onClick={() => toggleSection(section.id)}
          >
            <div className="text-[#667085] text-xs font-medium font-['Inter'] leading-[18px] w-2/5">{section.title}</div>
            <div className="text-[#667085] text-xs font-medium font-['Inter'] leading-[18px] w-1/5">Viewed</div>
            <div className="text-[#667085] text-xs font-medium font-['Inter'] leading-[18px] w-1/5">Dropped</div>
            <div className="text-[#667085] text-xs font-medium font-['Inter'] leading-[18px] w-1/5">Amount Consumed</div>
            <div className="flex items-center w-1/5 justify-end">
              {expandedSections[section.id] ? 
                <ChevronUp className="h-5 w-5 text-primary" /> : 
                <ChevronDown className="h-5 w-5 text-primary" />
              }
            </div>
          </div>

          {/* Section Content when expanded */}
          {expandedSections[section.id] && (
            <div>
              {/* Show column headers only for detailed sections */}

              {/* Render lectures based on section type */}
              {section.lectures.map((lecture, index) => (
                lecture.hasDetails ? (
                  // Detailed lecture row with metrics
                  <div key={index} className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50">
                    <div className="w-2/5">
                      <div className="text-[#2b2f38] text-sm font-medium font-['Inter'] leading-[21px]">{lecture.title}</div>
                      
                    </div>
                    <div className="text-[#5d6679] text-sm font-normal font-['Inter'] leading-[21px] w-1/5 ">{lecture.learners?.toLocaleString()} Learners</div>
                    <div className="w-1/5 text-xs text-center">{lecture.dropped}</div>
                    <div className="w-2/5 flex items-center">
                      <div className="w-3/5 mr-2">
                        <div className="bg-gray-200 rounded-full h-2 flex items-center">
                          <div 
                            className="bg-primary h-2 rounded-full relative items-center flex" 
                            style={{ width: `${lecture.amountConsumed}%` }}
                          >
                            <div 
                            className="bg-primary h-4 w-4 rounded-full right-0 absolute" 
                          />
                            </div>
                            
                            
                        </div>
                      </div>
                      <div className="w-1/5 text-right text-gray-600">{lecture.amountConsumed}%</div>
                    </div>
                  </div>
                ) : (
                  // Simple lecture row with just title
                  <div key={index} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                    <div className="text-[#2b2f38] text-sm font-medium font-['Inter'] leading-[21px">{lecture.title}</div>
                    <ChevronDown className="h-5 w-5 text-primary" />
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  }

  const BrandPopularityChart =({
  totalUsers = 3986,
  segments = [
    { name: 'Mobile', percentage: 32, color: '#FF7A5A' },
    { name: 'Tablet', percentage: 40, color: '#6C5CE7' },
    { name: 'Laptop', percentage: 28, color: '#38D2BA' }
  ]
}) => {
  // Calculate SVG parameters for the donut chart
  const size = 300;
  const center = size / 2;
  const radius = 120;
  const strokeWidth = 40;
  const innerRadius = radius - strokeWidth;
  
  // Calculate the circumference of the circle
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the strokes for each segment
  let startAngle = -90; // Start from the top (12 o'clock position)
  const segmentPaths = segments.map(segment => {
    const angle = (segment.percentage / 100) * 360;
    const endAngle = startAngle + angle;
    
    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    // Calculate the x and y coordinates
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    // Determine if the arc should be drawn as the large arc (more than 180 degrees)
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    // Create the path
    const path = `
      M ${center} ${center}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;
    
    // For the percentage indicator, calculate the position at the middle of the arc
    const midAngleRad = ((startAngle + angle / 2) * Math.PI) / 180;
    const labelRadius = radius + 15; // Slightly outside the donut
    const labelX = center + labelRadius * Math.cos(midAngleRad);
    const labelY = center + labelRadius * Math.sin(midAngleRad);
    
    // Update the starting angle for the next segment
    startAngle = endAngle;
    
    return {
      ...segment,
      path,
      labelX,
      labelY
    };
  });
  
  return (
    <div className="p-4 bg-white rounded-2xl shadow-[0px_1px_8px_0px_rgba(110,110,110,0.10)] mt-8">
      <h2 className="text-[#414d55] text-base font-bold font-['Poppins'] leading-tight tracking-tight mb-8">Brand popularity</h2>
      
      <div className="flex justify-center mb-8">
        <div className="relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {segmentPaths.map((segment, index) => (
              <React.Fragment key={index}>
                <path 
                  d={segment.path} 
                  fill={segment.color}
                />
                {segment.name === "Mobile" && (
                  <text 
                    x={segment.labelX} 
                    y={segment.labelY} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill="#fff" 
                    className="text-sm font-medium"
                  >
                    {segment.percentage}%
                  </text>
                )}
              </React.Fragment>
            ))}
            
            {/* White inner circle */}
            <circle 
              cx={center} 
              cy={center} 
              r={innerRadius} 
              fill="white" 
            />
            
            {/* Text in the center */}
            <text 
              x={center} 
              y={center - 10} 
              textAnchor="middle" 
              className="text-4xl font-bold text-gray-700"
            >
              {totalUsers}
            </text>
            <text 
              x={center} 
              y={center + 20} 
              textAnchor="middle" 
              className="text-xs uppercase text-gray-500"
            >
              OF ACTIVE USERS
            </text>
          </svg>
        </div>
      </div>
      
      {/* Category labels */}
      <div className="flex justify-center space-x-4">
        {segments.map((segment, index) => (
          <div 
            key={index}
            className="rounded-full px-4 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: segment.color }}
          >
            {segment.name}
          </div>
        ))}
      </div>
    </div>
  );
};



// const BrandPopularityChart = ({
//     totalUsers = 3986,
//     data = [
//       { name: "MOBILE", value: 32, color: "#FF7A5A" },
//       { name: "TABLET", value: 40, color: "#6C5CE7" },
//       { name: "LAPTOP", value: 28, color: "#38D2BA" }
//     ]
//   }) => {
//     // Find Mobile data to show percentage
//     const mobileData = data.find(item => item.name === "MOBILE");
//     const mobilePercentage = mobileData ? mobileData.value : 0;
  
//     return (
//       <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
//         <h2 className="text-2xl font-bold text-gray-700 mb-8">Brand popularity</h2>
        
//         <div className="relative h-80 mb-8">
//           <ResponsiveContainer width="100%" height="100%">
//             <PieChart>
//               <Pie
//                 data={data}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={80}
//                 outerRadius={120}
//                 paddingAngle={0}
//                 dataKey="value"
//                 startAngle={90}
//                 endAngle={-270}
//               >
//                 {data.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//                 <Label
//                   content={({ viewBox }) => {
//                     const { cx, cy } = viewBox;
//                     return (
//                       <>
//                         <text
//                           x={cx}
//                           y={cy - 10}
//                           textAnchor="middle"
//                           dominantBaseline="central"
//                           className="text-4xl font-bold fill-gray-700"
//                         >
//                           {totalUsers}
//                         </text>
//                         <text
//                           x={cx}
//                           y={cy + 20}
//                           textAnchor="middle"
//                           dominantBaseline="central"
//                           className="text-xs uppercase fill-gray-500"
//                         >
//                           OF ACTIVE USERS
//                         </text>
//                       </>
//                     );
//                   }}
//                 />
//               </Pie>
              
//               {/* Mobile percentage label */}
//               <text
//                 x="73%"
//                 y="30%"
//                 textAnchor="middle"
//                 dominantBaseline="central"
//                 className="text-sm font-medium fill-white"
//               >
//                 {mobilePercentage}%
//               </text>
//             </PieChart>
//           </ResponsiveContainer>
//         </div>
        
//         {/* Category labels */}
//         <div className="flex justify-center space-x-4">
//           {data.map((segment, index) => (
//             <div
//               key={index}
//               className="rounded-full px-4 py-1 text-xs font-medium text-white"
//               style={{ backgroundColor: segment.color }}
//             >
//               {segment.name}
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };