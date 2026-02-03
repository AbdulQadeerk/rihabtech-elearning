import React, { useState } from 'react';
import { couponService, CouponValidationResult } from '../../utils/couponService';

interface CouponInputProps {
  orderAmount: number;
  userId: string;
  categories?: string[];
  onCouponApplied: (result: CouponValidationResult) => void;
  onCouponRemoved: () => void;
  className?: string;
}

const CouponInput: React.FC<CouponInputProps> = ({
  orderAmount,
  userId,
  categories,
  onCouponApplied,
  onCouponRemoved,
  className = ''
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CouponValidationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setErrorMessage('Please enter a coupon code');
      return;
    }

    setIsValidating(true);
    setErrorMessage('');

    try {
      const result = await couponService.validateCoupon(
        couponCode.trim(),
        orderAmount,
        userId,
        categories
      );

      if (result.isValid) {
        setValidationResult(result);
        onCouponApplied(result);
        setErrorMessage('');
      } else {
        setErrorMessage(result.message);
        setValidationResult(null);
        onCouponRemoved();
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setErrorMessage('Error validating coupon. Please try again.');
      setValidationResult(null);
      onCouponRemoved();
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setValidationResult(null);
    setErrorMessage('');
    onCouponRemoved();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className={`coupon-input ${className}`}>
      {!validationResult ? (
        <form onSubmit={handleCouponSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isValidating}
            />
            <button
              type="submit"
              disabled={isValidating || !couponCode.trim()}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validating...
                </div>
              ) : (
                'Apply'
              )}
            </button>
          </div>
          
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
        </form>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium">
                Coupon Applied: {validationResult.coupon?.code}
              </span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
          
          <div className="mt-2 text-sm text-green-700">
            <p className="font-medium">
              {validationResult.coupon?.type === 'free' && 'Free Access'}
              {validationResult.coupon?.type === 'percentage' && `${validationResult.coupon.value}% off`}
              {validationResult.coupon?.type === 'fixed' && `₹${validationResult.coupon.value} off`}
            </p>
            
            {validationResult.discountAmount && validationResult.discountAmount > 0 && (
              <p>
                Discount: {formatCurrency(validationResult.discountAmount)}
              </p>
            )}
            
            <p className="font-semibold">
              Final Amount: {validationResult.finalAmount !== undefined ? formatCurrency(validationResult.finalAmount) : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponInput;
