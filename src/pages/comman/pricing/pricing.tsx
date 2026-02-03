// Pricing.tsx
import { Check, Loader2 } from "lucide-react";
import TrustAndEducationSections from "../landingPage/trustedcustomers";
import BestEducationSections from "../landingPage/besteducation";
import NewCourses from "./new-courses";
import PracticeAdvice from "./besteducation";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";
import { SubscriptionPaymentModal } from "../../../components/ui/SubscriptionPaymentModal";
import { pricingService, PricingPlan, PricingBreakdown } from "../../../utils/pricingService";
import { getUserActiveSubscription, Subscription } from "../../../utils/subscriptionService";
import { couponService, Coupon } from "../../../utils/couponService";
import { courseApiService, Category } from "../../../utils/courseApiService";

type AppliedCoupon = {
  couponId: string;
  code: string;
  planId: string;
  finalPrice: number;
  discount: number;
  originalPrice: number;
};

export default function Pricing() {
  const { user } = useAuth();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);

  // Coupon state — per plan
  const [couponCodes, setCouponCodes] = useState<Record<string, string>>({});
  const [couponErrors, setCouponErrors] = useState<Record<string, string>>({});
  const [couponLoading, setCouponLoading] = useState<Record<string, boolean>>({});
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const [selectedPlanForCoupon, setSelectedPlanForCoupon] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);

  useEffect(() => {
    loadPricingData();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      getUserActiveSubscription(user.email || user.uid)
        .then((sub) => setActiveSubscription(sub))
        .catch(console.error);
    } else {
      setActiveSubscription(null);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadAvailableCoupons();
  }, [user, selectedCategory]);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      const plans = await pricingService.refreshPricingPlans();
      setPricingPlans(plans);

      // Use courseApiService to get categories
      const categoriesData = await courseApiService.getPublicCategories();
      const categoryOptions = [
        { id: "all", name: "All Categories" },
        ...categoriesData.map((c: Category) => ({ id: c.id.toString(), name: c.title })),
      ];
      setCategories(categoryOptions);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load pricing information");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCoupons = async () => {
    try {
      const coupons = await couponService.getAvailableCoupons(user?.email || user?.uid || "", [selectedCategory]);
      setAvailableCoupons(coupons || []);
    } catch (err) {
      console.error(err);
    }
  };

  const calculatePrice = (plan: PricingPlan) => {
    const gstRate = Number(plan.gstRate || 0);
    const basePrice = Number(plan.basePrice || 0);
    const gstAmount = (basePrice * gstRate) / 100;
    return Math.round((basePrice + gstAmount) * 100) / 100;
  };

  const getFinalPrice = (plan: PricingPlan): number =>
    appliedCoupon?.planId === plan.id ? appliedCoupon.finalPrice : calculatePrice(plan);

  const getDiscount = (plan: PricingPlan): number =>
    appliedCoupon?.planId === plan.id ? appliedCoupon.discount : 0;

  const getCouponDisplayText = (coupon: any) => {
    if (!coupon) return "";
    return coupon.type === "percentage" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`;
  };

  const isExpiringSoon = (coupon: any) => {
    if (!coupon?.validUntil) return false;
    const until = coupon.validUntil instanceof Date ? coupon.validUntil : new Date(coupon.validUntil);
    return (until.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 7;
  };

  const handleStartSubscription = (plan: PricingPlan) => {
    if (!user) {
      toast.error("Please log in to purchase a subscription");
      window.location.hash = "#/login";
      return;
    }
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const refreshActiveSubscription = async () => {
    if (!user) return;
    try {
      const sub = await getUserActiveSubscription(user.email || user.uid);
      setActiveSubscription(sub);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaymentSuccess = async () => {
    toast.success("Subscription activated successfully!");
    setIsPaymentModalOpen(false);
    setSelectedPlan(null);
    await refreshActiveSubscription();
    
    // Dispatch event to refresh header subscriptions
    window.dispatchEvent(new CustomEvent('subscriptionUpdated'));
    
    const redirectUrl = localStorage.getItem("redirectAfterSubscription");
    window.location.hash = redirectUrl || "#/learner/homepage";
  };

  const getPricingBreakdown = (plan: PricingPlan): PricingBreakdown => {
    return pricingService.calculatePricingBreakdown(plan);
  };

  const getPlanFeatures = (plan: PricingPlan) => {
    if (plan.generalFeatures && plan.generalFeatures.length > 0) {
      return plan.generalFeatures.map((f: string) => ({ text: f }));
    }
    const baseFeatures = [
      { text: "Access to all courses in selected category" },
      { text: "HD video quality" },
      { text: "Mobile and desktop access" },
      { text: "Certificate upon completion" },
      { text: "24/7 customer support" },
    ];
    const duration = typeof plan.duration === "string" ? parseInt(plan.duration) : (plan.duration || 0);
    if (duration >= 6) {
      baseFeatures.push({ text: "Priority customer support" });
      baseFeatures.push({ text: "Exclusive content access" });
    }
    if (duration >= 12) {
      baseFeatures.push({ text: "All premium features included" });
      baseFeatures.push({ text: "Early access to new courses" });
    }
    return baseFeatures;
  };

  const getKeyFeatures = (plan: PricingPlan) => {
    if (plan.keyFeatures && plan.keyFeatures.length > 0) {
      return plan.keyFeatures.map((f: string) => ({ text: f }));
    }
    return [
      { text: "Unlimited course access" },
      { text: "Downloadable resources" },
      { text: "Progress tracking" },
      { text: "Community forum access" },
      { text: "Regular content updates" },
    ];
  };

const filteredPlans = pricingPlans.filter((plan) => {
  if (selectedCategory === "all") {
    return !plan.categoryId; // only plans without a category
  }
  return plan.categoryId === selectedCategory; // plans matching the selected category
});

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-gray-600">Loading pricing plans...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="banner-section-title text-center my-12">Choose the plan that fits your needs.</h1>

      {/* Category Selection */}
      <div className="px-4 md:px-16 mb-8">
        <div className="text-center mb-6">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full border-2 transition-all ${
                  selectedCategory === category.id
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <section className="p-4 md:px-16">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Plans Available</h3>
            <p className="text-gray-500">No pricing plans are currently available for the selected category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:-gap-8">
            {filteredPlans.map((plan) => {
              const breakdown = getPricingBreakdown(plan);
              const isCurrentPlan = activeSubscription?.planId?.toString() === plan.id?.toString();

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-8 ${
                    isCurrentPlan
                      ? "bg-white rounded-[44px] shadow-[0px_24px_83px_0px_rgba(0,0,0,0.10)] transform md:scale-105 z-10"
                      : "bg-orange-50 rounded-[44px]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className={`text-2xl font-bold ${isCurrentPlan ? "text-green-700" : "text-purple-900"}`}>
                        {plan.name}
                      </h2>
                      <p className="text-gray-600 mt-1">{plan.description}</p>
                    </div>
                    {isCurrentPlan && (
                      <div className="ml-4">
                        <span className="inline-block mt-1 px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Current Plan
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Long description */}
                  {plan.longDescription && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div
                        className="text-sm text-gray-700 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: plan.longDescription }}
                      />
                    </div>
                  )}

                  <div className="mt-6">
                    <h3 className="text-xl font-semibold">
                      {plan.durationText} - ₹{breakdown.totalPrice.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Total Price (Tax Inclusive)</p>
                  </div>

                  

                  {/* Action button */}
                  <div className="mt-6">
                    {!isCurrentPlan ? (
                      <button
                        className="mt-2 bg-primary border border-4 border-[#EFF0FF] text-white py-3 px-6 rounded-full font-medium hover:shadow-lg transition duration-300"
                        onClick={() => handleStartSubscription(plan)}
                      >
                        Start Subscription
                      </button>
                    ) : (
                      <button
                        disabled
                        className="mt-2 bg-gray-300 text-gray-600 py-3 px-6 rounded-full font-medium cursor-not-allowed"
                      >
                        Active
                      </button>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="mt-6 space-y-2">
                    {getPlanFeatures(plan).map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-700">
                        <span className="text-black mr-2">•</span>
                        {feature.text}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 mb-3">Key Features</h4>
                    <ul className="space-y-3">
                      {getKeyFeatures(plan).map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <Check className="h-5 w-5 text-black mr-2 flex-shrink-0" />
                          {feature.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      {/* Subscription Payment Modal */}
      {selectedPlan && (
        <SubscriptionPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPlan(null);
          }}
          onSuccess={handlePaymentSuccess}
          plan={selectedPlan}
          userDetails={{
            name: user?.displayName || "",
            email: user?.email || "",
            phone: "",
          }}
          selectedCategory={selectedCategory}
        />
      )}

      <TrustAndEducationSections />
      <PracticeAdvice />
      <NewCourses />
    </div>
  );
}
