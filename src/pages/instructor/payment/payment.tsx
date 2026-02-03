import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  BarChart3,
  BookOpen,
  Users,
  X,
  CreditCard
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { 
  instructorPayoutApiService, 
  PayoutRequest, 
  EarningsSummary, 
  PayoutBreakdown, 
  CourseEarnings 
} from "../../../utils/instructorPayoutApiService";
import { toast } from "sonner";
import { File } from "lucide-react";

export default function InstructorPayment() {
  console.log('=== InstructorPayment component START ===');
  
  const { user } = useAuth();
  console.log('Auth context user:', user);
  console.log('localStorage token:', localStorage.getItem('token'));
    
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [courseEarnings, setCourseEarnings] = useState<CourseEarnings[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<{ month: string; earnings: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentMonthBreakdown, setCurrentMonthBreakdown] = useState<PayoutBreakdown | null>(null);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'history' | 'analytics'>('overview');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('InstructorPayment component mounted');
    console.log('User object:', user);
    console.log('User UserName:', user?.UserName);
    console.log('Component state - loading:', loading, 'error:', error);
  }, [user, loading, error]);

  // Load payment data when user is available
  useEffect(() => {
    console.log('Attempting to load payment data...');
    if (user?.UserName) {
      console.log('User authenticated, loading payment data for:', user.UserName);
      loadPaymentData();
    } else {
      console.log('No user or UserName, setting loading to false');
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user?.UserName]);

  // Recalculate current month breakdown when month changes
  useEffect(() => {
    const updateCurrentMonthBreakdown = async () => {
      if (!user?.UserName) return;
      
      try {
        console.log('Updating month breakdown for:', selectedMonth, selectedYear);
        const breakdown = await instructorPayoutApiService.calculateEarnings(
          selectedMonth, 
          selectedYear
        );
        setCurrentMonthBreakdown(breakdown);

        // Load course earnings for the selected month
        const courseEarningsData = await instructorPayoutApiService.getCourseEarnings(
          selectedMonth,
          selectedYear
        );
        setCourseEarnings(courseEarningsData);
      } catch (error) {
        console.error('Error updating month breakdown:', error);
      }
    };

    updateCurrentMonthBreakdown();
  }, [user?.UserName, selectedMonth, selectedYear]);

  // Load monthly earnings for analytics
  useEffect(() => {
    const loadMonthlyEarnings = async () => {
      if (!user?.UserName) return;
      
      try {
        const monthlyData = await instructorPayoutApiService.getMonthlyEarnings(selectedYear);
        setMonthlyEarnings(monthlyData);
      } catch (error) {
        console.error('Error loading monthly earnings:', error);
      }
    };

    loadMonthlyEarnings();
  }, [user?.UserName, selectedYear]);

  // Simple fallback to prevent blank page - always render something
  const fallbackRender = (
    <div className="flex flex-col min-h-screen p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment & Earnings</h1>
        <p className="text-gray-600">Initializing...</p>
      </div>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </div>
  );

  // If component hasn't initialized yet, show fallback
  if (!user && !localStorage.getItem('token')) {
    console.log('No user or token, showing fallback');
    return fallbackRender;
  }

  // Simple fallback to prevent blank page
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment & Earnings</h1>
          <p className="text-gray-600">Loading user information...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Test render to ensure component is working
  console.log('Component is about to render main content');

  const loadPaymentData = async () => {
    try {
      console.log('Starting to load payment data...');
      setLoading(true);
      setError(null);
      
      if (!user?.UserName) {
        console.error('No user UserName found');
        toast.error('User not authenticated');
        setError('User not authenticated');
        return;
      }

      console.log('Loading earnings summary...');
      // Load earnings summary
      const summary = await instructorPayoutApiService.getEarningsSummary(selectedYear);
      console.log('Earnings summary loaded:', summary);
      setEarningsSummary(summary);

      console.log('Loading payout history...');
      // Load payout history
      const history = await instructorPayoutApiService.getPayoutHistory();
      console.log('Payout history loaded:', history);
      setPayoutHistory(history);

      console.log('Calculating current month breakdown...');
      // Calculate current month breakdown
      const breakdown = await instructorPayoutApiService.calculateEarnings(
        selectedMonth, 
        selectedYear
      );
      console.log('Current month breakdown calculated:', breakdown);
      setCurrentMonthBreakdown(breakdown);

      console.log('Loading course earnings...');
      // Load course earnings
      const courseEarningsData = await instructorPayoutApiService.getCourseEarnings(
        selectedMonth,
        selectedYear
      );
      console.log('Course earnings loaded:', courseEarningsData);
      setCourseEarnings(courseEarningsData);

      console.log('Loading monthly earnings...');
      // Load monthly earnings for analytics
      const monthlyData = await instructorPayoutApiService.getMonthlyEarnings(selectedYear);
      console.log('Monthly earnings loaded:', monthlyData);
      setMonthlyEarnings(monthlyData);

      console.log('All payment data loaded successfully');

    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Failed to load payment data');
      setError('Failed to load payment data. Using mock data instead.');
      
      // Use mock data as fallback
      console.log('Loading mock data as fallback...');
      setEarningsSummary(instructorPayoutApiService.getMockEarningsSummary());
      setPayoutHistory(instructorPayoutApiService.getMockPayoutHistory());
      setCourseEarnings(instructorPayoutApiService.getMockCourseEarnings());
      
      // Also set monthly earnings
      setMonthlyEarnings([
        { month: '2025-01', earnings: 1500 },
        { month: '2025-02', earnings: 2200 },
        { month: '2025-03', earnings: 1800 }
      ]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const normalizeStatus = (status: string): string => {
    return status.toLowerCase();
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processed':
      case 'processing':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processed':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'processed':
        return 'Processed';
      case 'processing':
        return 'Processing';
      default:
        return status || 'Unknown';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const handleRequestPayout = async () => {
    if (!user?.UserName) {
      toast.error('Please log in to request a payout');
      return;
    }

    if (!currentMonthBreakdown || currentMonthBreakdown.instructorShare < 100) {
      toast.error('Minimum payout amount is ₹100');
      return;
    }

    try {
      setRequestingPayout(true);
      
      await instructorPayoutApiService.requestPayout(selectedMonth, selectedYear);
      
      toast.success('Payout request submitted successfully!');
      
      // Reload data to show updated status
      await loadPaymentData();
      
    } catch (error) {
      console.error('Error requesting payout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to request payout';
      toast.error(errorMessage);
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleViewPayout = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setShowPayoutModal(true);
  };

  const handleDownloadReport = () => {
    // Implement report download logic
    console.log('Downloading report for month:', selectedMonth);
    toast.success('Report download started');
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(`${year}-${new Date().getMonth() + 1}`.padStart(2, '0'));
  };

  // Show error state
  if (error && !loading) {
    return (
      <div className="flex flex-col min-h-screen p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment & Earnings</h1>
          <p className="text-gray-600">There was an issue loading your payment information</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-medium text-red-900 mb-2">Error Loading Data</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            onClick={loadPaymentData}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Always show something to prevent blank page
  console.log('Component rendering main content. User:', user?.UserName, 'Loading:', loading, 'Error:', error);

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment & Earnings</h1>
          <p className="text-gray-600">Loading your payment information...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show authentication required state
  if (!user?.UserName) {
    return (
      <div className="flex flex-col min-h-screen p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment & Earnings</h1>
          <p className="text-gray-600">Please log in to view your payment information</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <h3 className="text-xl font-medium text-blue-900 mb-2">Authentication Required</h3>
          <p className="text-blue-700 mb-4">You need to be logged in to access your payment information.</p>
          <Button 
            onClick={() => window.location.hash = '#/login'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Main component render
  console.log('About to render main component content');
  
  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment & Earnings</h1>
        <p className="text-gray-600">Track your earnings, request payouts, and view payment history</p>
      </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'earnings', label: 'Earnings', icon: CreditCard },
                { id: 'history', label: 'Payout History', icon: Clock },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {earningsSummary ? formatCurrency(earningsSummary.totalEarnings) : '₹0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {earningsSummary ? earningsSummary.totalCourses.toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Courses</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {earningsSummary ? earningsSummary.totalCourses.toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available for Payout</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {earningsSummary ? formatCurrency(earningsSummary.availableForPayout) : '₹0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleRequestPayout}
                  disabled={requestingPayout || !currentMonthBreakdown || currentMonthBreakdown.instructorShare < 100}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {requestingPayout ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Request Payout
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDownloadReport}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">How Payouts Work</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Payouts are processed monthly based on watch time</li>
                  <li>• Platform fee is deducted from your earnings</li>
                  <li>• Minimum payout amount: ₹100</li>
                  <li>• Payouts are processed within 5-7 business days</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Earnings Calculation</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Earnings based on paid watch minutes</li>
                  <li>• Free courses and previews are excluded</li>
                  {/* <li>• Revenue sharing: 60% instructor, 40% platform</li> */}
                  <li>• Tax is calculated on the total amount</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Month/Year Selector */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = new Date(2025, i, 1);
                      const monthString = month.toISOString().slice(0, 7);
                      return (
                        <option key={monthString} value={monthString}>
                          {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(parseInt(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Current Month Breakdown */}
            {currentMonthBreakdown && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Earnings Breakdown for {formatMonth(selectedMonth)}
                </h3>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(currentMonthBreakdown.baseAmount)}
                    </p>
                  </div>
                  {/* <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Platform Fee (40%)</p>
                    <p className="text-2xl font-semibold text-orange-600">
                      {formatCurrency(currentMonthBreakdown.platformFee)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Tax (18%)</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {formatCurrency(currentMonthBreakdown.taxAmount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Your Share (60%)</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {formatCurrency(currentMonthBreakdown.instructorShare)}
                    </p>
                  </div> */}
                </div>
              </div>
            )}

            {/* Course Earnings */}
            {courseEarnings.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance</h3>
                <div className="space-y-4">
                  {courseEarnings.map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{course.courseTitle}</h4>
                        <p className="text-sm text-gray-600">{course.enrollments} students</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(course.earnings)}</p>
                        <p className="text-sm text-gray-600">{course.watchMinutes} min watched</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Payout History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payoutHistory.length > 0 ? (
                      payoutHistory.map((payout, index) => (
                        <tr key={payout.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payout.requestDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payout.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                              {getStatusText(payout.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatMonth(payout.month)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              onClick={() => handleViewPayout(payout)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No payout history available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Monthly Earnings Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings Trend</h3>
              {monthlyEarnings.length > 0 ? (
                <div className="space-y-4">
                  {monthlyEarnings.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">{formatMonth(month.month)}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(month.earnings)}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${Math.min((month.earnings / Math.max(...monthlyEarnings.map(m => m.earnings))) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No earnings data available for analytics</p>
              )}
            </div>
          </div>
        )}

        {/* Payout Details Modal */}
        {showPayoutModal && selectedPayout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Payout Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPayoutModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Month</p>
                    <p className="text-lg font-semibold text-gray-900">{formatMonth(selectedPayout.month)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Year</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPayout.year}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Amount</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedPayout.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedPayout.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayout.status)}`}>
                        {getStatusText(selectedPayout.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Financial Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Base Amount</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedPayout.totalEarnings)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Platform Fee (40%)</p>
                      <p className="text-lg font-semibold text-orange-600">{formatCurrency(selectedPayout.platformFee)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tax Amount (18%)</p>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(selectedPayout.taxAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Your Share (60%)</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedPayout.instructorShare)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Activity Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Watch Time</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedPayout.watchTimeMinutes} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Courses</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedPayout.courseCount} courses</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Request Date</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDate(selectedPayout.requestDate)}</p>
                    </div>
                    {selectedPayout.processedDate && (
                      <div>
                        <p className="text-sm text-gray-600">Processed Date</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(selectedPayout.processedDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedPayout.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-700">{selectedPayout.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowPayoutModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  console.log('=== InstructorPayment component END ===');
}
