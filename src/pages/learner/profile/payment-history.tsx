import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useAuth } from "../../../context/AuthContext";
import {
  PaymentTransaction,
} from "../../../utils/razorpayService";
import apiClient from "../../../utils/axiosInterceptor";
import { formatAmount } from "../../../lib/razorpay";
import LoadingIcon from "../../../components/ui/LoadingIcon";
// import { Banknote } from ;

interface PaymentHistoryProps {
  profile: any;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ profile }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPaymentHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Load real transactions from backend API using public endpoint
      // This endpoint uses CurrentUser.id automatically
      const response = await apiClient.get(
        `/Subscription/my-payment-transactions`
      );
      const apiTransactions = (response.data || []) as any[];

      const userTransactions: PaymentTransaction[] = apiTransactions.map(
        (t: any) => ({
          id: t.id?.toString() || "",
          userId: t.userId || "",
          userEmail: t.userEmail || "",
          userName: t.userName || "",
          userPhone: t.userPhone || "",
          planId: t.planId?.toString() || "",
          planName: t.planName || "",
          planDuration: t.planDuration || "",
          amount: t.amount || 0,
          taxAmount: t.taxAmount || 0,
          platformFee: t.platformFee || 0,
          instructorShare: 0,
          totalAmount: t.totalAmount || 0,
          currency: t.currency || "INR",
          categoryId: t.categoryId?.toString(),
          categoryName: t.categoryName,
          razorpayOrderId: t.razorpayOrderId || "",
          razorpayPaymentId: t.razorpayPaymentId,
          razorpaySignature: undefined,
          status:
            (t.status || "pending").toLowerCase() as
              | "pending"
              | "completed"
              | "failed"
              | "cancelled",
          paymentMethod: t.paymentMethod || "Razorpay",
          paymentDetails: {
            bank: t.paymentMethod || "N/A", // Use payment method as fallback since bank is not in API response
          },
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          receipt: t.receipt,
          notes: undefined, // Notes field not in API response
        })
      );

      setTransactions(userTransactions);
    } catch (err) {
      console.error("Error loading payment history:", err);
      setError("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    loadPaymentHistory();
  }, [loadPaymentHistory]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const downloadPDF = (transaction: PaymentTransaction) => {
    // Create PDF content
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Receipt - ${transaction.razorpayPaymentId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #ff7700; }
          .receipt-details { background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; }
          .amount { font-size: 18px; font-weight: bold; color: #ff7700; }
          .footer { margin-top: 30px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ZK TUTORIALS</div>
          <h2>Transaction Receipt</h2>
        </div>
        
        <div class="receipt-details">
          <div class="row">
            <span class="label">Transaction ID:</span>
            <span>${transaction.razorpayPaymentId}</span>
          </div>
          <div class="row">
            <span class="label">Plan:</span>
            <span>${transaction.planName} (${transaction.planDuration})</span>
          </div>
          <div class="row">
            <span class="label">Base Amount:</span>
            <span>₹${transaction.amount}</span>
          </div>
          <div class="row">
            <span class="label">Tax Amount:</span>
            <span>₹${transaction.taxAmount}</span>
          </div>
          <div class="row">
            <span class="label">Platform Fee:</span>
            <span>₹${transaction.platformFee}</span>
          </div>
          <div class="row">
            <span class="label">Total Amount:</span>
            <span class="amount">₹${transaction.totalAmount}</span>
          </div>
          <div class="row">
            <span class="label">Payment Method:</span>
            <span>${transaction.paymentMethod}</span>
          </div>
          <div class="row">
            <span class="label">Bank:</span>
            <span>${transaction.paymentDetails.bank}</span>
          </div>
          <div class="row">
            <span class="label">Status:</span>
            <span style="color: green; font-weight: bold;">${transaction.status.toUpperCase()}</span>
          </div>
          <div class="row">
            <span class="label">Date:</span>
            <span>${formatDate(transaction.createdAt)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your payment!</p>
          <p>For support, contact: support@zktutorials.com</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([pdfContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt_${transaction.razorpayPaymentId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    // Create CSV content (Excel compatible)
    const csvContent = [
      [
        "Transaction ID",
        "Plan",
        "Base Amount",
        "Tax Amount",
        "Platform Fee",
        "Total Amount",
        "Status",
        "Payment Method",
        "Bank",
        "Date",
      ],
      ...transactions.map((t) => [
        t.razorpayPaymentId,
        `${t.planName} (${t.planDuration})`,
        `₹${t.amount}`,
        `₹${t.taxAmount}`,
        `₹${t.platformFee}`,
        `₹${t.totalAmount}`,
        t.status.toUpperCase(),
        t.paymentMethod,
        t.paymentDetails.bank,
        formatDate(t.createdAt),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment_history_${new Date().toISOString().split("T")[0]
      }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-8 mt-8">
        <div className="flex items-center justify-center">
          <LoadingIcon className="inline-block" />
          <span className="ml-2 text-gray-600">Loading payment history...</span>
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

  return (
    <div className="w-full max-w-full space-y-8 mt-8 overflow-x-hidden">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-4 sm:p-6 md:p-8 overflow-hidden max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#ff7700] mb-2">
              Payment History
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Track all your payment transactions and receipts
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {transactions.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Transaction{transactions.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-full">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border border-green-200 min-w-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-2xl sm:text-3xl font-bold text-green-900 mb-1 break-words">
                  {formatAmount(
                    transactions
                      .filter((t) => t.status === "completed")
                      .reduce((sum, t) => sum + t.totalAmount, 0)
                  )}
                </div>
                <div className="text-xs sm:text-sm font-medium text-green-700">
                  Total Paid
                </div>
              </div>
              <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200 min-w-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">
                  {transactions.length}
                </div>
                <div className="text-xs sm:text-sm font-medium text-blue-700">
                  Total Payments
                </div>
              </div>
              <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-6 border border-purple-200 min-w-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-2xl sm:text-3xl font-bold text-purple-900 mb-1">
                  {transactions.filter((t) => t.status === "completed").length}
                </div>
                <div className="text-xs sm:text-sm font-medium text-purple-700">
                  Successful
                </div>
              </div>
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 sm:p-6 border border-orange-200 min-w-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-2xl sm:text-3xl font-bold text-orange-900 mb-1 break-words">
                  {transactions.length > 0
                    ? formatAmount(
                      transactions
                        .filter((t) => t.status === "completed")
                        .sort(
                          (a, b) =>
                            b.createdAt.getTime() - a.createdAt.getTime()
                        )[0]?.totalAmount || 0
                    )
                    : "₹0"}
                </div>
                <div className="text-xs sm:text-sm font-medium text-orange-700">
                  Last Payment
                </div>
              </div>
              <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm p-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No Payment History
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              This learner hasn't made any payments yet. All transactions will
              appear here once payments are made.
            </p>
            <Button
              onClick={loadPaymentHistory}
              className="bg-[#ff7700] hover:bg-[#e55e00] text-white px-6 py-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm overflow-hidden w-full max-w-full">
          <div className="p-4 sm:p-6 md:p-8 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Transaction Details
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  View and manage your payment transactions
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadExcel}
                  className="flex items-center px-4 py-2 border-gray-300 hover:bg-gray-50"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Refresh functionality
                    loadPaymentHistory();
                  }}
                  className="flex items-center px-4 py-2 border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 w-full">
              <div className="inline-block min-w-full align-middle w-full">
                <table className="min-w-full w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                        Transaction ID
                      </th>
                      <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                        Plan Details
                      </th>
                      <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                        Amount
                      </th>
                      <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                        Date
                      </th>
                      <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((transaction, index) => (
                      <tr
                        key={transaction.id}
                        className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          }`}
                      >
                        <td className="py-4 sm:py-6 px-3 sm:px-6">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            {getStatusIcon(transaction.status)}
                            <div>
                              <div className="text-sm font-mono text-gray-900 font-medium">
                                {transaction.razorpayPaymentId}
                              </div>
                              <div className="text-xs text-gray-500">
                                Order: {transaction.razorpayOrderId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 sm:py-6 px-3 sm:px-6">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {transaction.planName}
                            </div>
                            <div className="text-xs text-gray-500">
                              Duration: {transaction.planDuration}
                            </div>
                            {transaction.categoryName && (
                              <div className="text-xs text-gray-500">
                                Category: {transaction.categoryName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 sm:py-6 px-3 sm:px-6">
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-gray-900">
                              {formatAmount(transaction.totalAmount)}
                            </div>
                            {transaction.amount > 0 && (
                              <div className="text-xs text-gray-500">
                                Base: {formatAmount(transaction.amount)}
                              </div>
                            )}
                            {transaction.taxAmount > 0 && (
                              <div className="text-xs text-gray-500">
                                Tax: {formatAmount(transaction.taxAmount)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 sm:py-6 px-3 sm:px-6">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="py-4 sm:py-6 px-3 sm:px-6">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {formatDate(transaction.createdAt)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.paymentMethod} •{" "}
                              {transaction.paymentDetails.bank}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 sm:py-6 px-3 sm:px-6">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPDF(transaction)}
                              className="text-xs px-3 py-1 border-gray-300 hover:bg-gray-50"
                              title="Download PDF Receipt"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(transaction.receipt, "_blank")
                              }
                              className="text-xs px-3 py-1 border-gray-300 hover:bg-gray-50"
                              title="View Receipt"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
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
      )}
    </div>
  );
};

export default PaymentHistory;
