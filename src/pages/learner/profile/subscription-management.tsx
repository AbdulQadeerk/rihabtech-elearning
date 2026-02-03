import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../context/AuthContext";
import { formatAmount } from "../../../lib/razorpay";
import { subscriptionApiService } from "../../../utils/subscriptionApiService";

interface SubscriptionData {
  id: string;
  planName: string;
  planDuration: string | number; // Can be string like "179 Days" or number
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "cancelled";
  amount: number;
  currency: string;
  orderId: string;
  planId: string;
  userEmail: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  categoryName?: string;
  isActive: boolean;
}

interface SubscriptionManagementProps {
  profile: any;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  profile,
}) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    useEffect(() => {
    if (subscriptions.length > 0) {
      const activePlans = subscriptions.filter((sub) => sub.status === "active" && sub.isActive);
      if (activePlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(activePlans[0].id);
      }
    }
  }, [subscriptions, selectedPlanId]);

    const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
    // Note: selectSubscription is deprecated - API automatically determines active subscriptions
    // The selected plan UI state is maintained locally for display purposes only
    toast.success("Plan selected successfully!");
  };

  const loadSubscriptions = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Fetch subscriptions from API
      const apiSubscriptions = await subscriptionApiService.getUserSubscriptions(user.email);

      // Transform API subscriptions to SubscriptionData format
      const subscriptionData: SubscriptionData[] = apiSubscriptions.map((sub) => {
        const now = new Date();
        const endDate = sub.endDate ? new Date(sub.endDate) : new Date();
        const startDate = sub.startDate ? new Date(sub.startDate) : new Date();
        
        // Map API status to our status format
        let status: "active" | "expired" | "cancelled" = "cancelled";
        if (sub.status === "Active" && endDate > now && startDate <= now) {
          status = "active";
        } else if (sub.status === "Active" && endDate < now) {
          status = "expired";
        } else if (sub.status === "Cancelled") {
          status = "cancelled";
        } else if (sub.status === "Expired") {
          status = "expired";
        }

        const isActive = status === "active" && endDate > now && startDate <= now;

        return {
          id: sub.subscriptionId || sub.id?.toString() || "",
          planName: sub.planName || "Unknown Plan",
          planDuration: sub.numberOfDays || 30,
          startDate: startDate,
          endDate: endDate,
          status: status,
          amount: sub.totalAmount || 0,
          currency: sub.currency?.toLowerCase() || "inr",
          orderId: sub.orderId || "",
          planId: sub.planId?.toString() || "",
          userEmail: sub.userEmail || "",
          userId: sub.userId || user?.email || "",
          createdAt: sub.createdAt ? new Date(sub.createdAt) : new Date(),
          updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : new Date(),
          categoryName: sub.categoryName,
          isActive: isActive,
        };
      });

      // Sort by createdAt in descending order (most recent first)
      subscriptionData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setSubscriptions(subscriptionData);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast.error("Failed to load subscriptions");
    }
  }, [user?.email]);

  const loadData = useCallback(async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Load subscriptions
      await loadSubscriptions();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }, [user?.email, loadSubscriptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === "active" && isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    } else if (status === "expired") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    } else if (status === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    } else if (status === "cancelled") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Cancelled
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-8 mt-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff7700]" />
          <span className="ml-2 text-gray-600">
            Loading subscription data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      {/* Current Subscription Status */}
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#ff7700]">
            Active Subscription
          </h2>
          {subscriptions.length > 0 && (
            <div className="text-sm text-gray-600">
              {
                subscriptions.filter(
                  (sub) => sub.status === "active" && sub.isActive
                ).length
              }{" "}
              Active Plan(s)
            </div>
          )}
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Subscription
            </h3>
            <p className="text-gray-600 mb-4">
              Subscribe to a plan to access premium content and features.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => {
              const isSelected = selectedPlanId === subscription.id;
              return(
              <div
                key={subscription.id}
                className={`border rounded-lg p-4 transition ${
                    isSelected ? "border-[#ff7700] shadow-md" : "border-gray-200"
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {subscription.planName}
                  </h3>
                  {getStatusBadge(subscription.status, subscription.isActive)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">
                      {typeof subscription.planDuration === "string"
                        ? subscription.planDuration
                        : `${subscription.planDuration} days`}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-600">Valid Until:</span>
                    <span className="ml-2 font-medium">
                      {formatDate(subscription.endDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-medium">
                      {formatAmount(subscription.amount)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  {subscription.categoryName && (
                    <div>
                      <span className="text-gray-600">Category Access:</span>
                      <span className="ml-2 font-medium">
                        {subscription.categoryName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Order ID:</span>
                    <span className="ml-2 font-mono text-xs">
                      {subscription.orderId}
                    </span>
                  </div>
                  {/* <div>
                    <span className="text-gray-600">Currency:</span>
                    <span className="ml-2 font-medium uppercase">
                      {subscription.currency}
                    </span>
                  </div> */}
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {formatDate(subscription.createdAt)}
                    </span>
                  </div>
                </div>
                {subscription.status === "active" && subscription.isActive && (
                  <div className="mt-3 flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-blue-600">
                      {getDaysRemaining(subscription.endDate)} days remaining
                    </span>
                  </div>
                )}
                {subscription.status === "active" && subscription.isActive && (
                    <div className="mt-3 flex justify-end">
                      {isSelected ? (
                        <button
                          disabled
                          className="bg-gray-300 text-gray-700 py-1 px-4 rounded-full text-sm font-medium cursor-not-allowed"
                        >
                          Selected
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan(subscription.id)}
                          className="bg-[#ff7700] hover:bg-[#e55e00] text-white py-1 px-4 rounded-full text-sm font-medium"
                        >
                          Select Plan
                        </button>
                      )}
                    </div>
                  )}
              </div>
            );})}
          </div>
        )}
      </div>

      {/* Available Plans */}
      {/* <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
        <h2 className="text-xl font-bold text-[#ff7700] mb-4">
          Available Subscription Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="text-3xl font-bold text-[#ff7700] mb-2">
                  {formatAmount(plan.basePrice)}
                </div>
                <p className="text-sm text-gray-500">{plan.durationText}</p>
              </div>

              <div className="space-y-2 mb-6">
                {plan.keyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleDirectPurchase(plan)}
                disabled={purchasing === plan.id}
                className="w-full bg-[#ff7700] hover:bg-[#e55e00] text-white"
              >
                {purchasing === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div> */}

      {/* Transaction History */}
      {/* <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#ff7700]">
            Transaction History
          </h2>
          <Download className="w-5 h-5 text-gray-400" />
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Transactions Yet
            </h3>
            <p className="text-gray-600">
              Your payment history will appear here after making a purchase.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Transaction ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Plan
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">
                      {transaction.razorpayPaymentId}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.planName}
                        </div>
                        {transaction.categoryName && (
                          <div className="text-xs text-gray-500">
                            {transaction.categoryName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="py-3 px-4">
                      {transaction.status === "completed" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(transaction.receipt, "_blank")
                        }
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div> */}
    </div>
  );
};

export default SubscriptionManagement;
