import { Routes, Route } from 'react-router-dom';
import HomePage from './homepage';
import MyLearnings from './myAccount/myLearnings';
import MyWishlist from './myAccount/mywishlist';
import PaymentMethod from './payment-mode/payment';
import ShoppingCart from './shopping-cart/shopping';
import CourseDetailsPage from './playingcourse/currentCourseDetails';
import ChatInterface from './chatscreen/chatscreen';
// Profile routes removed - use /profile instead
import QuizWrapper from './playingcourse/QuizWrapper';
import NotificationList from './notifications/page';
import PaymentSuccess from './payment-success/PaymentSuccess';
import OrderHistory from './orders/OrderHistory';
import CourseDetails from '../comman/courses/courseDetails';

export default function LearnerRoutes() {
  return (
    <Routes>
      <Route path="homepage" element={<HomePage />} />
      <Route path="my-learnings" element={<MyLearnings />} />
      <Route path="my-wishlist" element={<MyWishlist />} />
      <Route path="payment" element={<PaymentMethod />} />
      <Route path="current-course" element={<CourseDetailsPage />} />
      <Route
  path="/courseDetails/:courseId"
  element={
      <CourseDetails />
  }
/>
<Route
  path="/courseDetails/:courseId/:sectionIndex"
  element={
      <CourseDetails />
  }
/>
      <Route path="quiz" element={<QuizWrapper />} />
      <Route path="shopping-cart" element={<ShoppingCart />} />
      <Route path="chat" element={<ChatInterface />} />
      {/* Profile routes removed - use /profile instead */}
      <Route path="notifications" element={<NotificationList />} />
      <Route path="payment-success" element={<PaymentSuccess />} />
      <Route path="order-history" element={<OrderHistory />} />
    </Routes>
  );
}
