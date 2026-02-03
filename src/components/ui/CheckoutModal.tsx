import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { X, CreditCard, Shield, Clock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../lib/stripe';
import { useAuth } from '../../context/AuthContext';
import { createPaymentIntent, createOrder, updateOrderStatus, enrollUserInCourse } from '../../utils/paymentService';
import { processSubscriptionPurchase } from '../../utils/subscriptionService';
import { toast } from 'sonner';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    title: string;
    pricing: string;
    thumbnailUrl?: string;
    description?: string;
  };
}

interface CheckoutFormProps {
  course: CheckoutModalProps['course'];
  onSuccess: () => void;
  onClose: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ course, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle different pricing types
  let amount = 0;
  let isFreeCourse = false;
  let isPaidSubscription = false;
  let isSubscriptionPurchase = false;

  if (course.pricing === 'Free') {
    amount = 0;
    isFreeCourse = true;
  } else if (course.pricing === 'paid') {
    isPaidSubscription = true;
  } else {
    amount = parseFloat(course.pricing) || 0;
    isFreeCourse = amount === 0;
    
    // Check if this is a subscription purchase (course ID starts with 'subscription-')
    isSubscriptionPurchase = course.id.startsWith('subscription-');
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      setError('Please log in to continue');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Handle subscription-based courses - should not reach here
      if (isPaidSubscription) {
        setError('This course requires a subscription plan. Please select a plan from the pricing page.');
        return;
      }

      // Handle subscription purchase
      if (isSubscriptionPurchase && !isFreeCourse) {
        // Extract plan details from course title
        const planId = course.id.replace('subscription-', '');
        const planName = course.title.split(' - ')[0].replace(' Subscription', '');
        const planDuration = course.title.split(' - ')[1] || '1 Month Plan';

        await processSubscriptionPurchase(
          user.uid,
          user.email || '',
          planId,
          planName,
          planDuration,
          amount
        );

        toast.success('Subscription activated successfully!');
        onSuccess();
        return;
      }

      // Handle free course enrollment
      if (isFreeCourse) {
        const { enrollInFreeCourse } = await import('../../utils/paymentService');
        await enrollInFreeCourse(course.id, user.uid, user.email || '', course.title);
        toast.success('Successfully enrolled in the course!');
        onSuccess();
        return;
      }

      // Handle paid course
      if (!stripe || !elements) {
        setError('Payment system not loaded. Please try again.');
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card information not found. Please try again.');
        return;
      }

      // Create order first
      const orderId = await createOrder(
        course.id,
        user.uid,
        user.email || '',
        course.title,
        amount
      );

      // For demo purposes, we'll simulate a successful payment
      // In a real implementation, you would create a payment intent on your backend
      const { error: stripeError } = await stripe.createToken(cardElement);
      
      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        await updateOrderStatus(orderId, 'failed');
        return;
      }

      // Simulate successful payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status and enroll user
      await updateOrderStatus(orderId, 'completed');
      await enrollUserInCourse(course.id, user.uid, user.email || '', orderId);

      toast.success('Payment successful! You are now enrolled in the course.');
      onSuccess();

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start gap-4">
          <img 
            src={course.thumbnailUrl || '/Images/courses/default-course.jpg'} 
            alt={course.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{course.title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {course.description || 'No description available'}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold text-primary">
                {isFreeCourse ? 'Free' : isPaidSubscription ? 'Subscription Required' : `₹${amount}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      {!isFreeCourse && !isPaidSubscription && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Information
          </h3>
          
          <div className="border border-gray-300 rounded-lg p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>


        </div>
      )}

      {/* Security Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Shield className="w-4 h-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={processing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={processing || isPaidSubscription || (!isFreeCourse && (!stripe || !elements))}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {processing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{isFreeCourse ? 'Enrolling...' : 'Processing...'}</span>
            </div>
          ) : (
            <span>
              {isPaidSubscription 
                ? 'Select Subscription Plan' 
                : isFreeCourse 
                  ? 'Enroll Now'
                  : isSubscriptionPurchase
                    ? `Subscribe for ₹${amount}`
                    : `Pay ₹${amount}`}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, course }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
      // Redirect based on purchase type
      if (course.id.startsWith('subscription-')) {
        // Redirect to courses page for subscription
        window.location.hash = '#/courselist';
      } else {
        // Redirect to my learnings for course enrollment
        window.location.hash = '#/learner/my-learnings';
      }
    }, 3000);
  };

  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Enrollment Successful!
            </h3>
            <p className="text-gray-600 mb-4">
              You have successfully enrolled in <strong>{course.title}</strong>
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Redirecting to your courses...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <CheckoutForm 
            course={course} 
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
