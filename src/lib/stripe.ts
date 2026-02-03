import { loadStripe } from '@stripe/stripe-js';

// Test publishable key - replace with your own test key
const stripePublishableKey = 'pk_test_51234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz12';

// Load Stripe
export const stripePromise = loadStripe(stripePublishableKey);

// Payment configuration
export const STRIPE_CONFIG = {
  currency: 'inr',
  country: 'IN',
  supportedPaymentMethods: ['card'],
};

// Test card numbers for development
export const TEST_CARDS = {
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expiredCard: '4000000000000069',
};