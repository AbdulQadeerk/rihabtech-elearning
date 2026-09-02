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
  CreditCard, 
  FileSpreadsheet, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  Check
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { API_BASE_URL } from "../../../lib/api";
import { 
  instructorPayoutApiService, 
  PayoutRequest, 
  EarningsSummary, 
  PayoutBreakdown, 
  CourseEarnings,
  InstructorEarnings
} from "../../../utils/instructorPayoutApiService";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const MONTHS = [
  { value: '01', name: 'January' },
  { value: '02', name: 'February' },
  { value: '03', name: 'March' },
  { value: '04', name: 'April' },
  { value: '05', name: 'May' },
  { value: '06', name: 'June' },
  { value: '07', name: 'July' },
  { value: '08', name: 'August' },
  { value: '09', name: 'September' },
  { value: '10', name: 'October' },
  { value: '11', name: 'November' },
  { value: '12', name: 'December' }
];

export default function InstructorPayment() {
  console.log('=== InstructorPayment component START ===');
  
  const { user } = useAuth();
  console.log('Auth context user:', user);
  console.log('localStorage token:', localStorage.getItem('token'));
    
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [allEarnings, setAllEarnings] = useState<InstructorEarnings[]>([]);
  const [courseEarnings, setCourseEarnings] = useState<CourseEarnings[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<{ month: string; earnings: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth() + 1).padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentMonthBreakdown, setCurrentMonthBreakdown] = useState<PayoutBreakdown | null>(null);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'history' | 'analytics'>('overview');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<string | number | null>(null);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<CourseEarnings | null>(null);

  const formatWatchTimeDisplay = (minutes: number) => {
    if (!minutes || minutes <= 0) return '0 mins';
    const totalSec = Math.round(minutes * 60);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m (${minutes.toFixed(2)} mins)`;
    }
    return `${minutes.toFixed(2)} mins`;
  };

  // Request Payout Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMonth, setRequestMonth] = useState<string>(
    String(new Date().getMonth() + 1).padStart(2, '0')
  );
  const [requestYear, setRequestYear] = useState<number>(new Date().getFullYear());
  const [bankName, setBankName] = useState<string>('');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

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
        const [breakdownRes, courseEarningsRes, courseListRes] = await Promise.allSettled([
          instructorPayoutApiService.calculateEarnings(selectedMonth, selectedYear),
          instructorPayoutApiService.getCourseEarnings(selectedMonth, selectedYear),
          fetch(`${API_BASE_URL}instructor/dashboard/course-watch-time`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
          }).then(r => r.ok ? r.json() : []).catch(() => [])
        ]);

        const breakdown = breakdownRes.status === 'fulfilled' ? breakdownRes.value : null;
        setCurrentMonthBreakdown(breakdown);

        let courses = (courseEarningsRes.status === 'fulfilled' && Array.isArray(courseEarningsRes.value) && courseEarningsRes.value.length > 0)
          ? courseEarningsRes.value
          : (breakdown?.courseBreakdown || []);

        const courseList = (courseListRes.status === 'fulfilled' && Array.isArray(courseListRes.value)) ? courseListRes.value : [];
        const courseMap = new Map<number | string, string>();
        courseList.forEach((c: any) => {
          if (c.courseId && c.courseTitle) {
            courseMap.set(c.courseId, c.courseTitle);
            courseMap.set(String(c.courseId), c.courseTitle);
          }
        });

        // Enrich course titles if any is generic 'Course' or missing
        courses = courses.map((c, idx) => {
          let title = c.courseTitle;
          if (!title || title.trim().toLowerCase() === 'course' || title.startsWith('Course #')) {
            title = courseMap.get(c.courseId) || courseMap.get(String(c.courseId)) || `Course ${c.courseId || idx + 1}`;
          }
          return {
            ...c,
            courseTitle: title
          };
        });

        setCourseEarnings(courses);
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
      const summary = await instructorPayoutApiService.getEarningsSummary(selectedYear);
      console.log('Earnings summary loaded:', summary);
      setEarningsSummary(summary);

      console.log('Loading all earnings...');
      const allEarningsData = await instructorPayoutApiService.getEarnings();
      setAllEarnings(allEarningsData);

      console.log('Loading payout history...');
      const history = await instructorPayoutApiService.getPayoutHistory();
      console.log('Payout history loaded:', history);
      setPayoutHistory(history);

      console.log('Calculating current month breakdown...');
      const breakdown = await instructorPayoutApiService.calculateEarnings(
        selectedMonth, 
        selectedYear
      );
      console.log('Current month breakdown calculated:', breakdown);
      setCurrentMonthBreakdown(breakdown);

      console.log('Loading course earnings...');
      const courseEarningsData = await instructorPayoutApiService.getCourseEarnings(
        selectedMonth,
        selectedYear
      );
      console.log('Course earnings loaded:', courseEarningsData);
      setCourseEarnings(courseEarningsData);

      console.log('Loading monthly earnings...');
      const monthlyData = await instructorPayoutApiService.getMonthlyEarnings(selectedYear);
      console.log('Monthly earnings loaded:', monthlyData);
      setMonthlyEarnings(monthlyData);

      console.log('All payment data loaded successfully');

    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Failed to load payment data');
      setError('Failed to load payment data.');
      setEarningsSummary(null);
      setPayoutHistory([]);
      setCourseEarnings([]);
      setMonthlyEarnings([]);
      setAllEarnings([]);
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
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'processed':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
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
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMonth = (monthString: string, yearVal?: number) => {
    if (!monthString) return '';
    let mClean = monthString;
    let yClean = yearVal || selectedYear;

    if (monthString.includes('-')) {
      const parts = monthString.split('-');
      if (parts.length >= 2) {
        yClean = parseInt(parts[0]) || yClean;
        mClean = parts[1];
      }
    }

    const found = MONTHS.find(m => m.value === mClean || m.value === mClean.padStart(2, '0'));
    const monthName = found ? found.name : mClean;
    return `${monthName} ${yClean}`;
  };

  const handleOpenRequestModal = () => {
    if (!user?.UserName) {
      toast.error('Please log in to request a payout');
      return;
    }

    if ((earningsSummary?.availableForPayout || 0) < 100) {
      toast.error(`Minimum payout threshold is ₹100. Current available balance: ${formatCurrency(earningsSummary?.availableForPayout || 0)}`);
      return;
    }

    // Default to the latest unpaid month with earnings if found
    const unpaidMonth = allEarnings.find(e => {
      const isAlreadyRequested = payoutHistory.some(p => 
        (p.month === e.month || p.month === e.month.padStart(2, '0')) && 
        p.year === e.year && 
        ['pending', 'approved', 'processed', 'processing'].includes(p.status.toLowerCase())
      );
      return !isAlreadyRequested && e.totalEarnings > 0;
    });

    if (unpaidMonth) {
      setRequestMonth(unpaidMonth.month.padStart(2, '0'));
      setRequestYear(unpaidMonth.year);
    } else {
      setRequestMonth(selectedMonth);
      setRequestYear(selectedYear);
    }

    setShowRequestModal(true);
  };

  const handleConfirmPayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.UserName) return;

    try {
      setRequestingPayout(true);
      
      await instructorPayoutApiService.requestPayout(requestMonth, requestYear, {
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        ifscCode: ifscCode.trim(),
        accountHolderName: accountHolderName.trim(),
        notes: payoutNotes.trim()
      });
      
      toast.success('Payout request submitted successfully! Our finance team will review and process it.');
      setShowRequestModal(false);
      
      // Reload all data to refresh available balance and history
      await loadPaymentData();
      
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to request payout';
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
    try {
      if (!earningsSummary) {
        toast.error('No earnings data available to export');
        return;
      }

      const wb = XLSX.utils.book_new();

      // 1. Overview Summary Sheet
      const summaryData = [
        ['ZK TUTORIALS - INSTRUCTOR EARNINGS & PAYOUT REPORT'],
        ['Generated At:', new Date().toLocaleString('en-IN')],
        ['Instructor:', user?.displayName || user?.UserName || 'Instructor'],
        [],
        ['Metric', 'Value'],
        ['Total All-Time Earnings', `₹${(earningsSummary.totalEarnings || 0).toLocaleString()}`],
        ['Available for Payout', `₹${(earningsSummary.availableForPayout || 0).toLocaleString()}`],
        ['Total Paid Watch Time (mins)', (earningsSummary.totalWatchTime || 0).toFixed(2)],
        ['Total Active Courses', earningsSummary.totalCourses || 0],
        ['Pending Payout Requests', earningsSummary.pendingPayouts || 0],
        ['Processed Payouts', earningsSummary.processedPayouts || 0],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Overview Summary');

      // 2. Monthly Earnings Breakdown Sheet
      if (allEarnings.length > 0) {
        const earningsHeader = ['Month', 'Year', 'Paid Watch Minutes', 'Total Courses', 'Instructor Share (₹)'];
        const earningsRows = allEarnings.map(e => [
          formatMonth(e.month, e.year),
          e.year,
          e.totalWatchMinutes,
          e.totalCourses,
          e.totalEarnings
        ]);
        const wsEarnings = XLSX.utils.aoa_to_sheet([earningsHeader, ...earningsRows]);
        XLSX.utils.book_append_sheet(wb, wsEarnings, 'Monthly Earnings');
      }

      // 3. Payout Requests History Sheet
      if (payoutHistory.length > 0) {
        const payoutHeader = ['Request ID', 'Month', 'Year', 'Requested Amount (₹)', 'Status', 'Requested Date', 'Processed Date', 'Bank Name', 'Account Number'];
        const payoutRows = payoutHistory.map(p => [
          p.payoutRequestId || p.id,
          formatMonth(p.month, p.year),
          p.year,
          p.amount || p.instructorShare,
          getStatusText(p.status),
          formatDate(p.requestDate),
          p.processedDate ? formatDate(p.processedDate) : 'N/A',
          p.bankDetails?.bankName || 'N/A',
          p.bankDetails?.accountNumber || 'N/A'
        ]);
        const wsPayouts = XLSX.utils.aoa_to_sheet([payoutHeader, ...payoutRows]);
        XLSX.utils.book_append_sheet(wb, wsPayouts, 'Payout History');
      }

      const fileName = `Instructor_Payout_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Earnings and payout report downloaded successfully!');
    } catch (err: any) {
      console.error('Error exporting payout report:', err);
      toast.error('Failed to export payout report');
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
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
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Watch Time</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {earningsSummary ? `${(earningsSummary.totalWatchTime || 0).toFixed(1)} m` : '0 m'}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-500">
                  {earningsSummary && earningsSummary.availableForPayout >= 100 ? (
                    <span className="text-green-600 font-medium">
                      You have {formatCurrency(earningsSummary.availableForPayout)} ready for withdrawal!
                    </span>
                  ) : (
                    <span>Available for withdrawal: {formatCurrency(earningsSummary?.availableForPayout || 0)} (Min ₹100 required)</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleOpenRequestModal}
                  disabled={requestingPayout || (earningsSummary?.availableForPayout || 0) < 100}
                  className="bg-primary hover:bg-primary/90 text-white shadow-sm flex items-center gap-2"
                >
                  {requestingPayout ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Request Payout
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDownloadReport}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download Excel Report
                </Button>
              </div>
            </div>
          </div>

          {/* Dynamic Active Payout & Status Tracker */}
          {payoutHistory.some(p => ['pending', 'approved', 'processing'].includes(p.status.toLowerCase())) ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-100 rounded-lg shrink-0 mt-0.5">
                  <Clock className="h-6 w-6 text-amber-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h4 className="text-base font-semibold text-amber-900">
                      Active Payout Request in Progress
                    </h4>
                    <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-200 text-amber-800">
                      {getStatusText(payoutHistory.find(p => ['pending', 'approved', 'processing'].includes(p.status.toLowerCase()))?.status || 'Pending')}
                    </span>
                  </div>
                  {(() => {
                    const activePayout = payoutHistory.find(p => ['pending', 'approved', 'processing'].includes(p.status.toLowerCase()));
                    if (!activePayout) return null;
                    return (
                      <div className="text-sm text-amber-800 space-y-1">
                        <p>
                          Requested Amount: <span className="font-semibold text-gray-900">{formatCurrency(activePayout.amount)}</span> for <span className="font-semibold">{formatMonth(activePayout.month, activePayout.year)}</span>
                        </p>
                        <p className="text-xs text-amber-700">
                          Submitted on {formatDate(activePayout.requestDate)}. Our finance team processes payouts within 5-7 business days via direct bank transfer.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-emerald-900">All Payouts Settled</h4>
                  <p className="text-sm text-emerald-800">
                    No pending withdrawal requests. Any new watch time revenue will be ready to withdraw in the next monthly settlement cycle.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Platform Dynamic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-blue-900">How Payouts Work</h3>
              </div>
              <ul className="space-y-2.5 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0"></span>
                  <span><strong>Monthly Cycle:</strong> Earnings are calculated and finalized at the end of each calendar month.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0"></span>
                  <span><strong>Minimum Threshold:</strong> Payout requests can be made for balances of ₹100 and above.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0"></span>
                  <span><strong>Direct Bank Transfer:</strong> Payouts are transferred via NEFT/IMPS within 5-7 business days upon approval.</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50/80 border border-green-100 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-700" />
                <h3 className="text-lg font-semibold text-green-900">Earnings Calculation Model</h3>
              </div>
              <ul className="space-y-2.5 text-sm text-green-800">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600 shrink-0"></span>
                  <span><strong>Paid Watch Time:</strong> Earnings are distributed proportionally based on total student watch minutes.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600 shrink-0"></span>
                  <span><strong>Excluded Content:</strong> Free introductory preview videos and non-subscriber watches are excluded from the pool.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600 shrink-0"></span>
                  <span><strong>Transparent Breakdown:</strong> Real-time reporting of individual course performance and learner watch counts.</span>
                </li>
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
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900 bg-white"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  className="block w-36 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900 bg-white"
                >
                  {[2023, 2024, 2025, 2026, 2027].map((year) => (
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
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Earnings Breakdown for {formatMonth(selectedMonth, selectedYear)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Proportional revenue calculated based on platform watch minutes
                  </p>
                </div>
                {currentMonthBreakdown.revenuePerMinute !== undefined && currentMonthBreakdown.revenuePerMinute > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    <span>Rate: ₹{currentMonthBreakdown.revenuePerMinute.toFixed(4)} / min</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Your Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(currentMonthBreakdown.instructorShare || currentMonthBreakdown.baseAmount || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Paid Watch Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(currentMonthBreakdown.totalWatchMinutes || 0).toFixed(2)} <span className="text-sm font-normal text-gray-500">mins</span>
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Revenue Per Minute</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{(currentMonthBreakdown.revenuePerMinute || 0).toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Course Earnings Breakdown */}
          {courseEarnings.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Course Performance & Learner Details
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Individual course watch time, proportional revenue share, and learner contributions for {MONTHS.find(m => m.value === selectedMonth)?.name || selectedMonth} {selectedYear}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{courseEarnings.length} Active {courseEarnings.length === 1 ? 'Course' : 'Courses'}</span>
                </span>
              </div>

              <div className="space-y-3.5">
                {courseEarnings.map((course, index) => {
                  const isExpanded = expandedCourseId === course.courseId || expandedCourseId === `${course.courseId}-${index}`;
                  const itemKey = `${course.courseId}-${index}`;
                  const totalMonthMinutes = currentMonthBreakdown?.totalWatchMinutes || courseEarnings.reduce((s, c) => s + (c.watchMinutes || 0), 0);
                  const sharePct = totalMonthMinutes > 0 ? ((course.watchMinutes / totalMonthMinutes) * 100).toFixed(1) : '0';
                  const perMinRate = currentMonthBreakdown?.revenuePerMinute || (course.watchMinutes > 0 ? course.earnings / course.watchMinutes : 0);

                  return (
                    <div 
                      key={itemKey} 
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        isExpanded 
                          ? 'bg-gradient-to-b from-white to-gray-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-50' 
                          : 'bg-white hover:bg-gray-50/80 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Course Header Row */}
                      <div 
                        className="p-4 sm:p-4.5 cursor-pointer flex flex-wrap items-center justify-between gap-4"
                        onClick={() => setExpandedCourseId(isExpanded ? null : itemKey)}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {/* Course Avatar */}
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-100 shadow-xs">
                            {course.courseTitle ? course.courseTitle.slice(0, 2).toUpperCase() : 'CO'}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate" title={course.courseTitle}>
                              {course.courseTitle}
                            </h4>
                            
                            <div className="flex items-center flex-wrap gap-2 mt-1">
                              {/* Interactive Active Students Pill */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCourseForModal(course);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
                                title="Click to inspect active learners breakdown"
                              >
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                <span>
                                  <strong className="font-bold">{course.enrollments}</strong> {course.enrollments === 1 ? 'student watched' : 'students watched'}
                                </span>
                                <span className="text-[10px] text-blue-500 underline ml-0.5">Details</span>
                              </button>

                              <span className="text-gray-300 text-xs hidden sm:inline">•</span>

                              <span className="text-xs text-gray-500">
                                {sharePct}% of monthly watch time
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side Stats & Actions */}
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="font-bold text-base text-emerald-600">
                              {formatCurrency(course.earnings)}
                            </p>
                            <p className="text-xs text-gray-600 font-medium">
                              {formatWatchTimeDisplay(course.watchMinutes)}
                            </p>
                          </div>

                          <button
                            type="button"
                            className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-indigo-600 bg-indigo-50' : ''
                            }`}
                            aria-label="Toggle details"
                          >
                            <ChevronDown className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Breakdown Drawer */}
                      {isExpanded && (
                        <div className="px-4 pb-4.5 pt-2 border-t border-gray-100 bg-gray-50/50">
                          {/* Calculation Formula Banner */}
                          <div className="bg-white p-3.5 rounded-lg border border-gray-200 mb-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-purple-600 shrink-0" />
                              <span className="text-gray-600">
                                <strong className="text-gray-800">Calculation Formula:</strong>{' '}
                                {course.watchMinutes.toFixed(2)} mins × ₹{perMinRate.toFixed(4)}/min = <strong className="text-emerald-600">{formatCurrency(course.earnings)}</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedCourseForModal(course)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                            >
                              <span>Open Full Breakdown</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Learner Breakdown Table / Insight */}
                          <div className="bg-white rounded-lg border border-gray-200 p-3.5 shadow-2xs">
                            <div className="flex items-center justify-between mb-2.5">
                              <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-blue-600" />
                                Learner Watch Time Contributions
                              </h5>
                              <span className="text-xs text-gray-500">
                                {course.enrollments} {course.enrollments === 1 ? 'Learner' : 'Learners'} Active
                              </span>
                            </div>

                            {course.learners && course.learners.length > 0 ? (
                              <div className="divide-y divide-gray-100">
                                {course.learners.map((learner, lIdx) => {
                                  const learnerShare = course.watchMinutes > 0 
                                    ? ((learner.watchMinutes / course.watchMinutes) * 100).toFixed(1) 
                                    : '0';
                                  return (
                                    <div key={lIdx} className="py-2 flex items-center justify-between gap-3 text-xs">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-[10px] shrink-0 border border-blue-100">
                                          {learner.learnerName ? learner.learnerName.slice(0, 1).toUpperCase() : 'U'}
                                        </div>
                                        <div className="min-w-0 truncate">
                                          <p className="font-semibold text-gray-800 truncate">{learner.learnerName || `Learner #${learner.userId}`}</p>
                                          {learner.learnerEmail && <p className="text-[11px] text-gray-500 truncate">{learner.learnerEmail}</p>}
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-semibold text-gray-900">{formatWatchTimeDisplay(learner.watchMinutes)}</p>
                                        <p className="text-[11px] text-gray-500">{learnerShare}% of course</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100/80 text-xs text-blue-800 flex items-start gap-2.5">
                                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-blue-900">
                                    {course.enrollments} active {course.enrollments === 1 ? 'student' : 'students'} engaged with this course in {MONTHS.find(m => m.value === selectedMonth)?.name || selectedMonth} {selectedYear}.
                                  </p>
                                  <p className="text-blue-700 text-[11px] mt-0.5">
                                    A total of {course.watchMinutes.toFixed(2)} paid minutes were consumed, earning you {formatCurrency(course.earnings)} at the rate of ₹{perMinRate.toFixed(4)}/minute.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

      {/* Request Payout Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] border border-gray-100">
            
            {/* Modal Header - Fixed */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Request Payout</h3>
                  <p className="text-xs text-gray-500">Withdraw your accumulated revenue share</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form id="payout-form" onSubmit={handleConfirmPayoutRequest} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Available Balance Summary */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Available for Withdrawal</p>
                  <p className="text-2xl font-bold text-emerald-950 mt-0.5">
                    {formatCurrency(earningsSummary?.availableForPayout || 0)}
                  </p>
                </div>
                <div className="text-right text-xs text-emerald-700">
                  <span className="inline-block bg-emerald-100/80 font-medium px-2 py-0.5 rounded-md mb-1">Min: ₹100</span>
                  <br />
                  <span>Mode: Bank Transfer</span>
                </div>
              </div>

              {/* Month & Year Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Earnings Month</label>
                  <select
                    value={requestMonth}
                    onChange={(e) => setRequestMonth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
                  <select
                    value={requestYear}
                    onChange={(e) => setRequestYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-900"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100">
                  <Building2 className="h-4 w-4 text-primary" />
                  Bank Account Details
                </h4>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder={user?.displayName || "Full name as on bank passbook"}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, SBI"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Enter bank account number"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Instructions (Optional)</label>
                  <input
                    type="text"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    placeholder="Any specific instructions for finance team..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </form>
            
            {/* Modal Footer - Fixed */}
            <div className="shrink-0 px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRequestModal(false)}
                disabled={requestingPayout}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="payout-form"
                size="sm"
                disabled={requestingPayout}
                className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
              >
                {requestingPayout ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm & Request Payout
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Details Modal */}
      {showPayoutModal && selectedPayout && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] border border-gray-100">
            
            {/* Header - Fixed */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="text-base font-bold text-gray-900">Payout Details</h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">Period</p>
                  <p className="text-base font-semibold text-gray-900">{formatMonth(selectedPayout.month, selectedPayout.year)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Status</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getStatusIcon(selectedPayout.status)}
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(selectedPayout.status)}`}>
                      {getStatusText(selectedPayout.status)}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-800 uppercase">Payout Amount</p>
                    <p className="text-xl font-bold text-emerald-950 mt-0.5">{formatCurrency(selectedPayout.amount)}</p>
                  </div>
                  {selectedPayout.payoutRequestId && (
                    <div className="text-right text-xs text-emerald-700">
                      <span className="font-mono text-[11px] bg-emerald-100/70 px-1.5 py-0.5 rounded">{selectedPayout.payoutRequestId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">Activity & Performance</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500">Paid Watch Time</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayout.watchTimeMinutes} mins</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500">Active Courses</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayout.courseCount} courses</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500">Requested Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedPayout.requestDate)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500">Processed Date</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayout.processedDate ? formatDate(selectedPayout.processedDate) : 'Pending'}</p>
                  </div>
                </div>
              </div>

              {selectedPayout.bankDetails?.accountNumber && (
                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Bank Transfer Details</h4>
                  <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
                    <p><span className="text-gray-500">Bank:</span> {selectedPayout.bankDetails.bankName || 'N/A'}</p>
                    <p><span className="text-gray-500">Account:</span> {selectedPayout.bankDetails.accountNumber}</p>
                    <p><span className="text-gray-500">IFSC:</span> {selectedPayout.bankDetails.ifscCode || 'N/A'}</p>
                  </div>
                </div>
              )}
              
              {selectedPayout.notes && (
                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Notes</h4>
                  <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">{selectedPayout.notes}</p>
                </div>
              )}
            </div>
            
            {/* Footer - Fixed */}
            <div className="shrink-0 px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <Button
                size="sm"
                onClick={() => setShowPayoutModal(false)}
                className="bg-gray-800 hover:bg-gray-900 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Course Learner Details Modal */}
      {selectedCourseForModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh] border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-sm backdrop-blur-xs shrink-0 border border-white/20">
                  <BookOpen className="w-5 h-5 text-indigo-200" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold truncate">
                    {selectedCourseForModal.courseTitle}
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Course Watch Breakdown · {MONTHS.find(m => m.value === selectedMonth)?.name || selectedMonth} {selectedYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseForModal(null)}
                className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors ml-2 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Earned</p>
                  <p className="text-lg font-bold text-emerald-800 mt-0.5">{formatCurrency(selectedCourseForModal.earnings)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <p className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">Watch Time</p>
                  <p className="text-sm font-bold text-blue-800 mt-1">{formatWatchTimeDisplay(selectedCourseForModal.watchMinutes)}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                  <p className="text-[11px] font-medium text-purple-700 uppercase tracking-wider">Students</p>
                  <p className="text-lg font-bold text-purple-800 mt-0.5">{selectedCourseForModal.enrollments}</p>
                </div>
              </div>

              {/* Calculation Box */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-1.5">
                <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Revenue Distribution Method
                </p>
                <p className="text-gray-600">
                  Your payout for this course is calculated proportionally based on platform watch minutes consumed by active learners during this month.
                </p>
                <div className="pt-1.5 border-t border-gray-200 text-gray-800 font-mono text-[11px]">
                  {selectedCourseForModal.watchMinutes.toFixed(2)} mins × ₹{(currentMonthBreakdown?.revenuePerMinute || (selectedCourseForModal.watchMinutes > 0 ? selectedCourseForModal.earnings / selectedCourseForModal.watchMinutes : 0)).toFixed(4)}/min = <strong className="text-emerald-700">{formatCurrency(selectedCourseForModal.earnings)}</strong>
                </div>
              </div>

              {/* Learners Section */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  Active Learners Contribution ({selectedCourseForModal.enrollments})
                </h4>

                {selectedCourseForModal.learners && selectedCourseForModal.learners.length > 0 ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {selectedCourseForModal.learners.map((learner, idx) => {
                      const learnerPct = selectedCourseForModal.watchMinutes > 0 
                        ? ((learner.watchMinutes / selectedCourseForModal.watchMinutes) * 100).toFixed(1) 
                        : '0';
                      return (
                        <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-gray-50/80 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {learner.learnerName ? learner.learnerName.slice(0, 1).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="font-semibold text-gray-900 truncate">{learner.learnerName || `Learner #${learner.userId}`}</p>
                              {learner.learnerEmail && <p className="text-[11px] text-gray-500 truncate">{learner.learnerEmail}</p>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-gray-900">{formatWatchTimeDisplay(learner.watchMinutes)}</p>
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {learnerPct}% share
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-1">
                    <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      {selectedCourseForModal.enrollments} {selectedCourseForModal.enrollments === 1 ? 'student' : 'students'} active in this period
                    </p>
                    <p className="text-blue-700 text-[11px]">
                      These learners actively watched lessons in this course totaling {selectedCourseForModal.watchMinutes.toFixed(2)} minutes during {MONTHS.find(m => m.value === selectedMonth)?.name || selectedMonth} {selectedYear}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <Button
                size="sm"
                onClick={() => setSelectedCourseForModal(null)}
                className="bg-gray-800 hover:bg-gray-900 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
