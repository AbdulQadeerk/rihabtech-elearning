import React, { useState, useEffect } from 'react';
import { couponService, Coupon } from '../../utils/couponService';

interface CouponDisplayProps {
  userId: string;
  categories?: string[];
  onCouponSelect?: (coupon: Coupon) => void;
  className?: string;
}

const CouponDisplay: React.FC<CouponDisplayProps> = ({
  userId,
  categories,
  onCouponSelect,
  className = ''
}) => {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailableCoupons();
  }, [userId, categories]);

  const loadAvailableCoupons = async () => {
    try {
      setLoading(true);
      const coupons = await couponService.getAvailableCoupons(userId, categories);
      setAvailableCoupons(coupons);
      setError('');
    } catch (err) {
      console.error('Error loading coupons:', err);
      setError('Failed to load available coupons');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCouponTypeLabel = (type: string) => {
    switch (type) {
      case 'free': return 'Free Access';
      case 'percentage': return 'Percentage Discount';
      case 'fixed': return 'Fixed Discount';
      default: return type;
    }
  };

  const getCouponTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'percentage': return 'bg-yellow-100 text-yellow-800';
      case 'fixed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiscountText = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'free':
        return 'Free Access';
      case 'percentage':
        return `${coupon.value}% off`;
      case 'fixed':
        return `₹${coupon.value} off`;
      default:
        return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className={`coupon-display ${className}`}>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Loading available coupons...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`coupon-display ${className}`}>
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={loadAvailableCoupons}
            className="mt-2 text-orange-500 hover:text-orange-600 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (availableCoupons.length === 0) {
    return (
      <div className={`coupon-display ${className}`}>
        <div className="text-center py-4">
          <p className="text-gray-500">No coupons available at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`coupon-display ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Coupons</h3>
        <p className="text-sm text-gray-600">
          Save money with these exclusive offers
        </p>
      </div>

      <div className="space-y-3">
        {availableCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer"
            onClick={() => onCouponSelect?.(coupon)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCouponTypeBadgeClass(coupon.type)}`}>
                    {getCouponTypeLabel(coupon.type)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {coupon.usedCount}/{coupon.maxUses} used
                  </span>
                </div>

                <h4 className="font-medium text-gray-900 mb-1">
                  {coupon.name}
                </h4>

                {coupon.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {coupon.description}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="font-medium text-orange-600">
                    {getDiscountText(coupon)}
                  </span>
                  
                  {coupon.minAmount && coupon.minAmount > 0 && (
                    <span>Min: ₹{coupon.minAmount}</span>
                  )}
                  
                  {coupon.maxDiscount && coupon.maxDiscount > 0 && (
                    <span>Max: ₹{coupon.maxDiscount}</span>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  <p>Valid from: {formatDate(coupon.validFrom)}</p>
                  <p>Valid until: {formatDate(coupon.validUntil)}</p>
                </div>

                {coupon.categories && coupon.categories.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Applicable categories:</p>
                    <div className="flex flex-wrap gap-1">
                      {coupon.categories.map((category, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-4">
                <code className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                  {coupon.code}
                </code>
              </div>
            </div>

            {onCouponSelect && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCouponSelect(coupon);
                  }}
                >
                  Use This Coupon
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          * Coupons are subject to terms and conditions. One coupon per order.
        </p>
      </div>
    </div>
  );
};

export default CouponDisplay;
