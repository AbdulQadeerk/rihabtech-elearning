import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Download,
  RefreshCw,
  Eye,
  Clock,
  Users,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { format } from 'date-fns';
import revenueReportService, { 
  RevenueTransaction, 
  CourseRevenueData, 
  MonthlyTrend, 
  RevenueAnalytics 
} from '../../../utils/revenueReportService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Interfaces are now imported from the service

const RevenueReport: React.FC = () => {
  const { user } = useAuth();
  const [revenueData, setRevenueData] = useState<RevenueTransaction[]>([]);
  const [courseRevenueData, setCourseRevenueData] = useState<CourseRevenueData[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'analytics'>('table');

  const instructorId = user?.UserName || user?.email || 'abdulquader152@gmail.com';
  console.log('Current user:', user);
  console.log('Using instructorId:', instructorId);

  const loadRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading revenue data for instructor:', instructorId);
      
      const period = parseInt(selectedPeriod);
      
      console.log('Fetching real-time data from Firebase...');
      
      // Test Firebase connection first
      console.log('Testing Firebase connection...');
      const testQuery = query(collection(db, 'payoutRequests'), where('instructorId', '==', instructorId));
      const testSnapshot = await getDocs(testQuery);
      console.log('Firebase test query result:', testSnapshot.docs.length, 'documents found');
      
      if (testSnapshot.docs.length > 0) {
        console.log('Sample Firebase document:', testSnapshot.docs[0].data());
      }
      
      const [transactions, courses, trends, analyticsData] = await Promise.all([
        revenueReportService.getRevenueTransactions(instructorId, period, selectedStatus, selectedCourse),
        revenueReportService.getCourseRevenueData(instructorId),
        revenueReportService.getMonthlyTrends(instructorId, period),
        revenueReportService.getRevenueAnalytics(instructorId, period)
      ]);

      console.log('Firebase data fetched successfully:');
      console.log('Transactions:', transactions.length);
      console.log('Courses:', courses.length);
      console.log('Trends:', trends.length);
      console.log('Analytics:', analyticsData);
      console.log('Sample transaction:', transactions[0]);
      console.log('Sample course:', courses[0]);

      console.log('Setting state with real data:');
      console.log('Setting revenueData:', transactions.length, 'items');
      console.log('Setting courseRevenueData:', courses.length, 'items');
      console.log('Setting monthlyTrends:', trends.length, 'items');
      console.log('Setting analytics:', analyticsData);
      
      setRevenueData(transactions);
      setCourseRevenueData(courses);
      setMonthlyTrends(trends);
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Error loading revenue data:', error);
      // Set empty data instead of mock data
      setRevenueData([]);
      setCourseRevenueData([]);
      setMonthlyTrends([]);
      setAnalytics({
        totalRevenue: 0,
        totalPending: 0,
        totalProcessed: 0,
        totalWatchTime: 0,
        totalStudents: 0,
        totalCourses: 0,
        averageRevenuePerStudent: 0,
        averageWatchTimePerStudent: 0,
        completionRate: 0,
        monthlyGrowth: 0
      });
    } finally {
      setLoading(false);
    }
  }, [instructorId, selectedPeriod, selectedStatus, selectedCourse]);

  useEffect(() => {
    loadRevenueData();
  }, [loadRevenueData]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('=== STATE CHANGED ===');
    console.log('revenueData length:', revenueData.length);
    console.log('courseRevenueData length:', courseRevenueData.length);
    console.log('monthlyTrends length:', monthlyTrends.length);
    console.log('analytics:', analytics);
    console.log('===================');
  }, [revenueData, courseRevenueData, monthlyTrends, analytics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return '✓';
      case 'approved': return '⏳';
      case 'pending': return '⏱️';
      case 'rejected': return '❌';
      default: return '?';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'dd MMM yyyy');
  };

  const filteredRevenueData = revenueData.filter(item => {
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (selectedCourse !== 'all') {
      // Filter by course if needed
      return true; // Simplified for now
    }
    return true;
  });

  const totalRevenue = analytics?.totalRevenue || filteredRevenueData.reduce((sum, item) => sum + (item.totalEarnings || item.amount || 0), 0);
  const totalPending = analytics?.totalPending || filteredRevenueData.filter(item => item.status === 'pending').reduce((sum, item) => sum + (item.totalEarnings || item.amount || 0), 0);
  const totalProcessed = analytics?.totalProcessed || filteredRevenueData.filter(item => item.status === 'processed').reduce((sum, item) => sum + (item.totalEarnings || item.amount || 0), 0);
  const totalWatchTime = analytics?.totalWatchTime || filteredRevenueData.reduce((sum, item) => sum + item.watchTimeMinutes, 0);

  console.log('=== REVENUE CALCULATION DEBUG ===');
  console.log('Analytics object:', analytics);
  console.log('Filtered Revenue Data:', filteredRevenueData);
  console.log('Filtered Revenue Data length:', filteredRevenueData.length);
  console.log('Calculated totals:');
  console.log('Total Revenue:', totalRevenue);
  console.log('Total Pending:', totalPending);
  console.log('Total Processed:', totalProcessed);
  console.log('Total Watch Time:', totalWatchTime);
  console.log('================================');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading revenue data...</span>
        </div>
      </div>
    );
  }

  console.log('Revenue Report rendering with data:');
  console.log('Revenue Data:', revenueData.length);
  console.log('Course Revenue Data:', courseRevenueData.length);
  console.log('Monthly Trends:', monthlyTrends.length);
  console.log('Analytics:', analytics);

  // Show message when there's no data
  if (revenueData.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <div className="w-12 h-12 text-gray-400" >₹</div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Revenue Data Found</h3>
          <p className="text-gray-600 mb-4">
            No revenue transactions found for instructor: <span className="font-medium">{instructorId}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This could mean you haven't received any payouts yet, or there might be an issue with the data connection.
          </p>
          <div className="flex justify-center space-x-3">
            <Button 
              onClick={loadRevenueData}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.hash = '#/instructor/dashboard'}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Report</h1>
          <p className="text-gray-600 mt-1">Track your earnings and revenue analytics</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={loadRevenueData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">This Month</SelectItem>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                  <SelectItem value="24">Last 2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courseRevenueData.map(course => (
                    <SelectItem key={course.courseId} value={course.courseId}>
                      {course.courseTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table View</SelectItem>
                  <SelectItem value="chart">Chart View</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalProcessed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Watch Time</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(totalWatchTime / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Table */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Revenue Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    {/* <TableHead>Platform Fee</TableHead>
                    <TableHead>Instructor Share</TableHead>
                    <TableHead>Tax</TableHead> */}
                    <TableHead>Watch Time</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Processed Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRevenueData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {format(new Date(item.year, parseInt(item.month.split('-')[1]) - 1), 'MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)} {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.amount)}</TableCell>
                      {/* <TableCell>{formatCurrency(item.platformFee)}</TableCell>
                      <TableCell className="text-green-600 font-semibold">{formatCurrency(item.instructorShare)}</TableCell>
                      <TableCell>{formatCurrency(item.taxAmount)}</TableCell> */}
                      <TableCell>{Math.round(item.watchTimeMinutes / 60)}h {item.watchTimeMinutes % 60}m</TableCell>
                      <TableCell>{item.courseCount}</TableCell>
                      <TableCell>{formatDate(item.requestDate)}</TableCell>
                      <TableCell>{formatDate(item.processedDate)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course-wise Revenue */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Course-wise Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseRevenueData.map((course) => (
                  <div key={course.courseId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{course.courseTitle}</h4>
                      <p className="text-sm text-gray-600">{course.totalStudents} students</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(course.totalRevenue)}</p>
                      <p className="text-sm text-gray-600">{Math.round(course.totalWatchTime / 60)}h watch time</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyTrends.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value) => format(new Date(value + '-01'), 'MMM')}
                      />
                      <YAxis 
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                        labelFormatter={(label) => format(new Date(label + '-01'), 'MMMM yyyy')}
                      />
                      <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No monthly trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. Revenue per Student</span>
                  <span className="font-semibold">{formatCurrency(analytics?.averageRevenuePerStudent || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. Watch Time per Student</span>
                  <span className="font-semibold">{Math.round((analytics?.averageWatchTimePerStudent || 0) / 60)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Course Completion Rate</span>
                  <span className="font-semibold">{Math.round(analytics?.completionRate || 0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Growth</span>
                  <span className={`font-semibold ${(analytics?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(analytics?.monthlyGrowth || 0) >= 0 ? '+' : ''}{(analytics?.monthlyGrowth || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Student Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Students</span>
                  <span className="font-semibold">{analytics?.totalStudents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Courses</span>
                  <span className="font-semibold">{analytics?.totalCourses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Watch Time</span>
                  <span className="font-semibold">{Math.round((analytics?.totalWatchTime || 0) / 60)}h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseRevenueData.map((course) => (
                  <div key={course.courseId} className="border-b pb-2 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 truncate">{course.courseTitle}</span>
                      <span className="text-sm text-green-600 font-semibold">{formatCurrency(course.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{course.totalStudents} students</span>
                      <span>{course.completionRate}% complete</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RevenueReport;
