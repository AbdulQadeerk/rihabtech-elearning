import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { razorpayService, SubscriptionPaymentData } from '../../utils/razorpayService';
import { initializeRazorpay, formatAmount } from '../../lib/razorpay';
import { PricingPlan } from '../../utils/pricingService';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Coupon, couponService } from '../../utils/couponService';
import { couponApiService, PreviewCouponRequest, ConfirmCouponRequest } from '../../utils/couponApiService';

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan: PricingPlan;
  selectedCategory?: string;
  userDetails?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Credit/Debit Cards, UPI, Net Banking',
    available: true
  }
];

export const SubscriptionPaymentModal: React.FC<SubscriptionPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  plan,
  selectedCategory = "all",
  userDetails
}) => {
  const { user } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('IN');
  const [userInfo, setUserInfo] = useState({
    name: userDetails?.name || user?.displayName || '',
    email: userDetails?.email || user?.email || '',
    phone: userDetails?.phone || ''
  });

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [isCouponValidating, setIsCouponValidating] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponId, setCouponId] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadRazorpay();
      loadAvailableCoupons();
      // Reset coupon state when modal opens
      setCouponCode("");
      setCouponMessage("");
      setCouponDiscount(0);
      setAppliedCouponCode("");
      setCouponId("");
    }
  }, [isOpen]);
  
  // Recalculate pricing when discount changes
  useEffect(() => {
    // This will trigger a re-render with updated pricing
    // The calculatePricingBreakdown is called in render, so it will use the latest couponDiscount
  }, [couponDiscount]);

  const loadRazorpay = async () => {
    try {
      await initializeRazorpay();
      setRazorpayLoaded(true);
    } catch (error) {
      console.error('Failed to load Razorpay:', error);
      toast.error('Failed to load payment gateway');
    }
  };

  const loadAvailableCoupons = async () => {
    try {
      const orderAmount = plan.totalAmount ?? plan.basePrice ?? 0;
      const coupons = await couponService.getAvailableCoupons(
        user?.email || user?.uid || "", 
        [selectedCategory],
        orderAmount
      );
      setAvailableCoupons(coupons || []);
    } catch (err) {
      console.error('Error loading coupons:', err);
    }
  };

  const validateCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim();
    if (!code) {
      setCouponMessage("Please enter a coupon code.");
      return;
    }

    if (!userInfo.email) {
      toast.error("Please enter your email first");
      return;
    }

    setIsCouponValidating(true);
    setCouponMessage("");

    try {
      // Calculate base amount (before tax) for coupon validation
      const totalAmount = plan.totalAmount ?? plan.basePrice ?? 0;
      const basePrice = plan.basePrice || (totalAmount > 0 ? totalAmount / (1 + plan.taxPercentage / 100) : 0);
      
      // Use custom API for coupon validation
      const request: PreviewCouponRequest = {
        couponCode: code,
        planId: plan.id,
        categoryId: plan.categoryId ? parseInt(plan.categoryId) : 0,
        subCategoryId: 0, // Subscription plans may not have subcategories
        orderAmount: basePrice, // Use base price (before tax) for coupon calculation
        userId: user?.email || userInfo.email,
        userEmail: userInfo.email
      };

      const response = await couponApiService.previewCoupon(request);

      if (!response?.couponApplicable) {
        setCouponMessage(response?.message || "Invalid coupon code.");
        setCouponDiscount(0);
        setAppliedCouponCode("");
        setCouponId("");
        return;
      }

      const discountAmt = response.discountAmount ?? 0;
      
      setCouponDiscount(discountAmt);
      setAppliedCouponCode(code);
      setCouponId(response.couponId?.toString() || "");
      setCouponMessage(`Coupon applied! You saved ₹${discountAmt.toFixed(2)}`);
      toast.success("Coupon applied successfully");
    } catch (err: any) {
      console.error('Coupon validation error:', err);
      const errorMessage = err?.message || "Failed to apply coupon. Try again.";
      setCouponMessage(errorMessage);
      setCouponDiscount(0);
      setAppliedCouponCode("");
      setCouponId("");
    } finally {
      setIsCouponValidating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateUserInfo = (): boolean => {
    if (!userInfo.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!userInfo.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!userInfo.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    const phoneDigits = userInfo.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const calculatePricingBreakdown = () => {
    const totalAmount = (plan as any).totalAmount || 0;
    let basePrice = plan.basePrice || 0;

    if (basePrice === 0 && totalAmount > 0) {
      basePrice = totalAmount / (1 + plan.taxPercentage / 100);
    }

    // Apply coupon discount to base price
    let finalBaseAmount = basePrice;
    if (couponDiscount > 0) {
      finalBaseAmount = Math.max(0, basePrice - couponDiscount);
    }

    const finalTaxAmount = (finalBaseAmount * plan.taxPercentage) / 100;
    const platformFee = (finalBaseAmount * plan.platformFeePercentage) / 100;
    const instructorShare = finalBaseAmount - platformFee;
    const finalTotalAmount = finalBaseAmount + finalTaxAmount;

    return {
      originalBaseAmount: basePrice,
      baseAmount: finalBaseAmount,
      taxAmount: finalTaxAmount,
      platformFee,
      instructorShare,
      totalAmount: finalTotalAmount,
      discount: couponDiscount
    };
  };

  const handlePayment = async () => {
    if (!validateUserInfo()) return;

    setIsProcessing(true);

    try {
      const pricing = calculatePricingBreakdown();
      
      const paymentData: SubscriptionPaymentData = {
        userId: user?.email || '',
        userEmail: userInfo.email,
        userName: userInfo.name,
        userPhone: userInfo.phone,
        planId: plan.id,
        planName: plan.name,
        planDuration: plan.durationText,
        amount: pricing.baseAmount,
        taxAmount: pricing.taxAmount,
        platformFee: pricing.platformFee,
        instructorShare: pricing.instructorShare,
        totalAmount: pricing.totalAmount,
        currency: 'INR',
        categoryId: plan.categoryId,
        categoryName: plan.categoryName,
        couponCode: appliedCouponCode || undefined,
        couponDiscount: couponDiscount || undefined
      };

      // Check if it's a free plan (₹0)
      if (pricing.totalAmount === 0) {
        // Handle free subscription directly without Razorpay
        const subscriptionId = await razorpayService.handleFreeSubscription(paymentData);
        
        toast.success('Subscription activated successfully!');
        onSuccess();
        onClose();

        // Confirm coupon usage via custom API if coupon was applied
        if (couponId && appliedCouponCode) {
          try {
            const confirmRequest: ConfirmCouponRequest = {
              couponId: parseInt(couponId),
              planId: plan.id,
              subscriptionId: subscriptionId,
              userId: user?.email || userInfo.email,
              userEmail: userInfo.email,
              orderAmount: pricing.originalBaseAmount, // Original base amount before discount
              discountAmount: couponDiscount, // Discount amount applied
              finalAmount: pricing.totalAmount // Final amount after discount and tax
            };
            console.log('Confirming coupon usage (free plan):', confirmRequest);
            await couponApiService.confirmCoupon(confirmRequest);
            console.log('Coupon usage confirmed successfully');
          } catch (err) {
            console.error('Coupon confirmation error:', err);
            // Don't show error to user as subscription is already activated
            // But log it for debugging
          }
        }

        // Dispatch event to refresh header subscriptions
        window.dispatchEvent(new CustomEvent('subscriptionUpdated'));

        const redirectUrl = localStorage.getItem('redirectAfterSubscription');
        if (redirectUrl) {
          window.location.hash = redirectUrl;
          localStorage.removeItem('redirectAfterSubscription');
        } else {
          window.location.hash = '#/learner/homepage';
        }
        return;
      }

      // For paid plans, proceed with Razorpay
      if (!razorpayLoaded) {
        toast.error('Payment gateway is not loaded yet');
        setIsProcessing(false);
        return;
      }

      const transactionId = await razorpayService.createPaymentTransaction(paymentData);
      const { options } = await razorpayService.initiatePayment(transactionId, paymentData);

      // Capture pricing for use in payment success handler
      const finalPricing = pricing;

      const Razorpay = (window as any).Razorpay;

      options.handler = async function (response: any) {
        try {
          console.log('Razorpay payment success response:', JSON.stringify(response, null, 2));
          console.log('Response keys:', Object.keys(response));
          const subscriptionId = await razorpayService.handlePaymentSuccess(transactionId, response);
          toast.success('Payment successful! Your subscription is now active.');
          onSuccess();
          onClose();

          // Confirm coupon usage via custom API if coupon was applied
          if (couponId && appliedCouponCode) {
            try {
              const confirmRequest: ConfirmCouponRequest = {
                couponId: parseInt(couponId),
                planId: plan.id,
                subscriptionId: subscriptionId,
                userId: user?.email || userInfo.email,
                userEmail: userInfo.email,
                orderAmount: finalPricing.originalBaseAmount, // Original base amount before discount
                discountAmount: couponDiscount, // Discount amount applied
                finalAmount: finalPricing.totalAmount // Final amount after discount and tax
              };
              console.log('Confirming coupon usage:', confirmRequest);
              await couponApiService.confirmCoupon(confirmRequest);
              console.log('Coupon usage confirmed successfully');
            } catch (err) {
              console.error('Coupon confirmation error:', err);
              // Don't show error to user as subscription is already activated
              // But log it for debugging
            }
          }

          const redirectUrl = localStorage.getItem('redirectAfterSubscription');
          if (redirectUrl) {
            window.location.hash = redirectUrl;
            localStorage.removeItem('redirectAfterSubscription');
          } else {
            window.location.hash = '#/learner/homepage';
          }
        } catch (error: any) {
          console.error('Payment success handling error:', error);
          const errorMessage = error?.message || error?.response?.data?.message || 'Unknown error';
          console.error('Full error details:', error);
          toast.error(`Payment processed but error activating subscription: ${errorMessage}. Please contact support.`);
          setIsProcessing(false);
        }
      };

      const razorpay = new Razorpay(options);
      
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response);
        toast.error('Payment failed. Please try again.');
        setIsProcessing(false);
      });

      razorpay.open();
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const pricing = calculatePricingBreakdown();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Subscription</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Plan Summary with Coupon */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
            <p className="text-gray-600 mb-4">{plan.description}</p>

            <div className="flex flex-col gap-4">
              {/* Price Display */}
              <div className="flex items-center gap-2">
                {couponDiscount > 0 && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatAmount(pricing.originalBaseAmount + (pricing.originalBaseAmount * plan.taxPercentage / 100))}
                  </span>
                )}
                <span className="text-2xl font-bold text-blue-600">
                  {formatAmount(pricing.totalAmount)}
                </span>
                <span className="text-sm text-gray-500">{plan.durationText}</span>
              </div>

              {/* Coupon Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Coupon Code</label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isProcessing || isCouponValidating}
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={() => validateCoupon()}
                    disabled={isProcessing || isCouponValidating || !couponCode}
                  >
                    {isCouponValidating ? "Validating..." : "Apply"}
                  </button>
                </div>

                {/* Validation Message */}
                {couponMessage && (
                  <p className={`text-sm ${couponDiscount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {couponMessage}
                  </p>
                )}

                {/* Browse Coupons */}
                {availableCoupons.length > 0 && (
                  <button
                    className="text-sm text-blue-600 underline hover:text-blue-800 self-start"
                    onClick={() => setShowCouponsModal(true)}
                    disabled={isProcessing}
                  >
                    Browse Available Coupons
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  disabled={isProcessing}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <PhoneInput
                  country={'in'}
                  value={userInfo.phone}
                  onChange={(value, country) => {
                    handleInputChange('phone', value);
                    const c = country as { iso2?: string };
                    if (c && c.iso2) {
                      setPhoneCountry(c.iso2.toUpperCase());
                    }
                  }}
                  inputClass="!h-[42px] !pl-[60px] !w-full !border !border-gray-300 !rounded-md !text-sm focus:!ring-2 focus:!ring-blue-500 focus:!border-blue-500"
                  buttonClass="!border !border-gray-300 !rounded-l-md !rounded-r-none"
                  containerClass="!w-full"
                  inputProps={{
                    name: 'phone',
                    required: true,
                    autoFocus: false,
                    placeholder: 'Enter your phone number',
                    disabled: isProcessing,
                  }}
                  enableSearch={true}
                  searchPlaceholder="Search country..."
                  searchNotFound="No country found"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Payment Method</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => method.available && setSelectedPaymentMethod(method.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {selectedPaymentMethod === method.id ? (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-medium">{formatAmount(pricing.baseAmount)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCouponCode})</span>
                  <span className="font-medium">-{formatAmount(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({plan.taxPercentage}%)</span>
                <span className="font-medium">{formatAmount(pricing.taxAmount)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-lg">Total Amount</span>
                  <span className="font-bold text-lg text-blue-600">
                    {formatAmount(pricing.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Secure Payment</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your payment information is encrypted and secure. We use Razorpay for processing payments.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isProcessing || (pricing.totalAmount > 0 && !razorpayLoaded)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {pricing.totalAmount === 0 ? 'Subscribe Free' : `Pay ${formatAmount(pricing.totalAmount)}`}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Available Coupons Modal */}
      {showCouponsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Available Coupons</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCouponsModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availableCoupons.length === 0 ? (
              <p className="text-sm text-gray-600">No coupons available for this plan.</p>
            ) : (
              <div className="space-y-3 overflow-y-auto">
                {availableCoupons.map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center justify-between border rounded p-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {c.code}
                      </p>
                      <p className="text-xs text-green-600 font-semibold">
                        {c.type === "percentage"
                          ? `${c.value}% OFF`
                          : `₹${c.value} OFF`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{c.description}</p>
                    </div>
                    <button
                      className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition ml-3"
                      onClick={() => {
                        setCouponCode(c.code);
                        validateCoupon(c.code);
                        setShowCouponsModal(false);
                        setCouponId(c.id);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};