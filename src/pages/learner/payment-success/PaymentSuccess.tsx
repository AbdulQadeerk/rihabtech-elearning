import React, { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { CheckCircle, Clock, BookOpen, ArrowRight } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";

interface CourseInfo {
  id: string;
  title: string;
  thumbnailUrl?: string;
  description?: string;
}

const PaymentSuccess: React.FC = () => {
  const { user } = useAuth();
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Get parameters from URL hash
  const getUrlParams = () => {
    const hash = window.location.hash;
    const queryString = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(queryString);
    return {
      courseId: params.get("courseId"),
      orderId: params.get("orderId"),
    };
  };

  const { courseId, orderId } = getUrlParams();

  useEffect(() => {
    const fetchCourseInfo = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        const courseRef = doc(db, "courseDrafts", courseId);
        const courseSnap = await getDoc(courseRef);

        if (courseSnap.exists()) {
          const courseData = courseSnap.data() as any;
          setCourseInfo({
            id: courseId,
            title: courseData.title || "Unknown Course",
            thumbnailUrl: courseData.thumbnailUrl,
            description: courseData.description,
          });
        }
      } catch (error) {
        console.error("Error fetching course info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseInfo();
  }, [courseId]);

  const handleGoToCourse = () => {
    if (courseId) {
      window.location.hash = `#/learner/current-course?courseId=${courseId}`;
    }
  };

  const handleGoToDashboard = () => {
    window.location.hash = "#/learner/my-learnings";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Congratulations! You have successfully enrolled in the course.
          </p>

          {/* Course Info */}
          {courseInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                {courseInfo.thumbnailUrl ? (
                  <img
                    src={courseInfo.thumbnailUrl}
                    alt={courseInfo.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {courseInfo.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    You can now access all course materials
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Details */}
          {orderId && (
            <div className="bg-blue-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Order ID:</strong> {orderId}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Save this for your records
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">
              What's Next?
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Access your course materials anytime</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Track your progress as you learn</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Get a certificate upon completion</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {courseId && (
              <Button
                onClick={handleGoToCourse}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                Start Learning Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleGoToDashboard}
              className="w-full"
            >
              View My Courses
            </Button>
          </div>

          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team at{" "}
              <a
                href="mailto:support@rihabtech.com"
                className="text-primary hover:underline"
              >
                support@rihabtech.com
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>You will receive a confirmation email shortly</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
