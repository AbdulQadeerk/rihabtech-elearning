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
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export const MonthlyReports = () =>{
    const data = [
        {
          timePeriod: "31 April 2025",
          custName: "Rajesh Kumar Singh",
          courseName: "Introduction To Digital Design Part 1",
          channel: "Promotion",
          coupenCode: "25BBPMXPLOYTRMT",
          netEarning: "$99,999.99",
          pricePaid: "$99,999,99",
        },
        {
          timePeriod: "31 April 2025",
          custName: "Rajesh Kumar Singh",
          courseName: "Introduction To Digital Design Part 1",
          channel: "Promotion",
          coupenCode: "25BBPMXPLOYTRMT",
          netEarning: "$99,999.99",
          pricePaid: "$99,999,99",
        },
        {
          timePeriod: "31 April 2025",
          custName: "Rajesh Kumar Singh",
          courseName: "Introduction To Digital Design Part 1",
          channel: "Promotion",
          coupenCode: "25BBPMXPLOYTRMT",
          netEarning: "$99,999.99",
          pricePaid: "$99,999,99",
        },
        {
          timePeriod: "31 April 2025",
          custName: "Rajesh Kumar Singh",
          courseName: "Introduction To Digital Design Part 1",
          channel: "Promotion",
          coupenCode: "25BBPMXPLOYTRMT",
          netEarning: "$99,999.99",
          pricePaid: "$99,999,99",
        },
      ];
    return(
        <div className="p-6">
        <div className="flex items-center">
          <h1 className="form-title mr-6">Revenue Report</h1>
          <div>
          <Select defaultValue="april">
                            <SelectTrigger className="rounded-none text-primary border border-primary">
                                <SelectValue placeholder="Choose a Currency" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="april">April</SelectItem>
                                <SelectItem value="development">May</SelectItem>

                            </SelectContent>
                        </Select>
                        </div>
          </div>

          <div className="bg-gray-50 p-6 flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6">
      <div className="flex-1">
        <RevenueCard 
          title="All Courses" 
          data={DATA.lifetimeRevenue} 
          showDropdown={true}
          showLegend={true}
        />
      </div>
      
      <div className="flex-1">
        <RevenueCard 
          title="All Courses" 
          data={DATA.promotionActivity} 
        />
      </div>
      
      <div className="flex-1">
        <RevenueCard 
          title="All Courses" 
          data={DATA.courseEarnings} 
        />
      </div>
    </div>
        
        <div className="p-4 mt-4">
            <h1 className="py-2 text-[#414d55] text-base font-medium font-['Poppins'] leading-tight tracking-tight">Revenue List</h1>
            <Table>
          <TableHeader className="ins-table-header">
            <TableRow className="table-head-text">
              <TableHead>Time Period</TableHead>
              <TableHead>Pre Tax Amount</TableHead>
              <TableHead>Without Holding Tax</TableHead>
              <TableHead>Net Earning</TableHead>
              <TableHead>Expected Payout Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} className="ins-table-row">
                <TableCell className="table-body-text">{row.timePeriod}</TableCell>
                <TableCell className="table-body-text">{row.custName}</TableCell>
                <TableCell className="table-body-text">{row.courseName}</TableCell>
                <TableCell className="table-body-text">{row.netEarning}</TableCell>
                <TableCell className="table-body-text">{row.pricePaid}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        </div>
    )
  }

  const DATA = {
    lifetimeRevenue: [
      { name: 'Udemy Organic', value: 60, color: '#FFD700' },
      { name: 'Ad Program', value: 15, color: '#3B82F6' },
      { name: 'Your Promotions', value: 15, color: '#FCA5A5' },
      { name: 'Refunds', value: 10, color: '#DC2626' },
    ],
    promotionActivity: [
      { name: 'Udemy Organic', value: 55, color: '#FF8C00' },
      { name: 'Ad Program', value: 15, color: '#3B82F6' },
      { name: 'Your Promotions', value: 15, color: '#FCA5A5' },
      { name: 'Empty', value: 15, color: '#F3F4F6' },
    ],
    courseEarnings: [
      { name: 'Udemy Organic', value: 55, color: '#FF8C00' },
      { name: 'Ad Program', value: 15, color: '#3B82F6' },
      { name: 'Your Promotions', value: 15, color: '#FCA5A5' },
      { name: 'Empty', value: 15, color: '#F3F4F6' },
    ]
  };


  // Revenue card component that displays a donut chart with details
interface RevenueCardProps {
  title: string;
  data: { name: string; value: number; color: string }[];
  showDropdown?: boolean;
  showLegend?: boolean;
}

const RevenueCard = ({ title, data, showDropdown = false, showLegend = false }: RevenueCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {title}
            {showDropdown && (
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="ml-2 text-gray-500 focus:outline-none"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
              </button>
            )}
          </h2>
        </div>
        
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
              <p className="text-3xl font-bold">₹99,999</p>
              <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                {title === "All Courses" ? "Life Time Revenue" : 
                 title === "All Courses" && data === DATA.promotionActivity ? "Your Promotion Activity" : 
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
                    ₹99,999
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };