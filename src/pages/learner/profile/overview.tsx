import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Clock,
  Users,
  CreditCard,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Star,
  Award,
  TrendingUp,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useAuth } from "../../../context/AuthContext";
import LoadingIcon from "../../../components/ui/LoadingIcon";
import { formatAmount } from "../../../lib/razorpay";
import { subscriptionApiService } from "../../../utils/subscriptionApiService";

interface OverviewStats {
  enrolledCourses: number;
  avgProgress: number;
  watchMinutes: number;
  subscriptions: number;
  activeSubscriptions: number;
  totalSpent: number;
  joinDate: Date;
  lastOnline: Date;
  phone: string;
  address: string;
}

interface OverviewProps {
  profile: any;
}

const Overview: React.FC<OverviewProps> = ({ profile }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverviewData = useCallback(async () => {
    if (!user?.uid || !profile) return;

    setLoading(true);
    setError("");

    try {
      // Fetch subscriptions from API
      const subscriptions = await subscriptionApiService.getUserSubscriptions(user.email || user.uid);
      
      // Calculate total spent from subscriptions (all paid subscriptions count)
      const totalSpent = subscriptions
        .filter((sub) => sub.status === "Active" || sub.status === "Pending")
        .reduce((sum: number, sub) => sum + (sub.totalAmount || 0), 0);

      // Calculate active subscriptions count (Active status and not expired)
      const now = new Date();
      const activeSubscriptionsCount = subscriptions.filter((sub) => {
        if (sub.status !== "Active") return false;
        const endDate = sub.endDate ? new Date(sub.endDate) : null;
        const startDate = sub.startDate ? new Date(sub.startDate) : new Date();
        return endDate ? (endDate > now && startDate <= now) : false;
      }).length;

      // Use data from API response (studentProfile object)
      const studentProfile = profile?.studentProfile || {};
      const overviewStats: OverviewStats = {
        enrolledCourses: studentProfile.enrolledCourses || 0,
        avgProgress: studentProfile.averageProgress || 0,
        watchMinutes: studentProfile.watchMinutes || 0,
        subscriptions: subscriptions.length, // Use actual count from API
        totalSpent: totalSpent || 0,
        activeSubscriptions: activeSubscriptionsCount, // Add active subscriptions count
        joinDate: profile.createdDate ? new Date(profile.createdDate) : new Date(),
        lastOnline: profile.createdDate ? new Date(profile.createdDate) : new Date(),
        phone: profile.phoneNumber || "",
        address: profile.address || "",
      };

      setStats(overviewStats);
    } catch (err) {
      console.error("Error loading overview data:", err);
      setError("Failed to load overview data");
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(date);
  };

  const getDaysAgo = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-8 mt-8">
        <div className="flex items-center justify-center">
          <LoadingIcon className="inline-block" />
          <span className="ml-2 text-gray-600">Loading overview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-8 mt-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 mt-8">
      {/* Learner Info */}
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
        <div className="flex items-center space-x-6">
          {/* Profile Picture */}
          {/* <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {getInitials(profile?.name || "User")}
          </div> */}

          {/* User Details */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {profile?.name}
            </h2>
            <p className="text-gray-600 mb-2">
              {profile?.emailId}
            </p>
            {/* {profile?.studentProfile?.statusText && (
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profile.studentProfile.status === 1 
                    ? 'bg-green-100 text-green-800' 
                    : profile.studentProfile.status === 2
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {profile.studentProfile.statusText}
                </span>
              </div>
            )} */}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Enrolled Courses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.enrolledCourses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgProgress}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Watch Minutes</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.watchMinutes}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.subscriptions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Info */}
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Activity Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Join Date</p>
                <p className="text-sm text-gray-900">
                  {formatDate(stats.joinDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Last Online</p>
                <p className="text-sm text-gray-900">
                  {formatDate(stats.lastOnline)}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Phone</p>
                <p className="text-sm text-gray-900">{stats.phone}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Address</p>
                <p className="text-sm text-gray-900">{stats.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Financial Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-2">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Total Spent</p>
            <p className="text-xl font-bold text-gray-900">
              {formatAmount(stats.totalSpent)}
            </p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              Active Subscriptions
            </p>
            <p className="text-xl font-bold text-gray-900">
              {stats.activeSubscriptions || 0}
            </p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Member Since</p>
            <p className="text-xl font-bold text-gray-900">
              {new Date().getFullYear() - stats.joinDate.getFullYear()} years
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
