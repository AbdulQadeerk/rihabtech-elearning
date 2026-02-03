import React from "react";
import { nodemailerService } from "../utils/nodemailerService";

// Example usage of the NodemailerService in React Frontend

export class EmailUsageExamples {
  // Example 1: Send subscription confirmation
  static async sendSubscriptionConfirmation() {
    try {
      const result = await nodemailerService.sendSubscriptionConfirmation({
        userEmail: "user@example.com",
        userName: "John Doe",
        planName: "Premium Plan",
        planDuration: "1 Year",
        amount: 999,
        currency: "₹",
        receipt: "RCP-123456",
        paymentId: "PAY-789012",
        subscriptionId: "SUB-345678",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        categoryName: "SAP",
      });

      if (result.success) {
        console.log("Subscription confirmation sent:", result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        console.error("Failed to send email:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error:", error);
      return { success: false, error: "Unknown error occurred" };
    }
  }

  // Example 2: Send instructor approval
  static async sendInstructorApproval() {
    try {
      const result = await nodemailerService.sendInstructorApproval({
        userEmail: "instructor@example.com",
        userName: "Jane Smith",
      });

      if (result.success) {
        console.log("Instructor approval sent:", result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        console.error("Failed to send email:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error:", error);
      return { success: false, error: "Unknown error occurred" };
    }
  }

  // Example 3: Send course approval
  static async sendCourseApproval() {
    try {
      const result = await nodemailerService.sendCourseApproval({
        userEmail: "instructor@example.com",
        userName: "Jane Smith",
        courseName: "Advanced React Development",
      });

      if (result.success) {
        console.log("Course approval sent:", result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        console.error("Failed to send email:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error:", error);
      return { success: false, error: "Unknown error occurred" };
    }
  }

  // Example 4: Send subscription revoked
  static async sendSubscriptionRevoked() {
    try {
      const result = await nodemailerService.sendSubscriptionRevoked({
        userEmail: "user@example.com",
        userName: "John Doe",
        reason: "Policy violation",
      });

      if (result.success) {
        console.log(
          "Subscription revoked notification sent:",
          result.messageId
        );
        return { success: true, messageId: result.messageId };
      } else {
        console.error("Failed to send email:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error:", error);
      return { success: false, error: "Unknown error occurred" };
    }
  }

  // Example 5: Send monthly payout notification
  static async sendMonthlyPayout() {
    try {
      const result = await nodemailerService.sendMonthlyPayout({
        userEmail: "instructor@example.com",
        userName: "Jane Smith",
        monthYear: "January 2025",
        totalWatchMinutes: 1500,
        instructorShare: 492,
        platformFee: 328,
        taxAmount: 180,
      });

      if (result.success) {
        console.log("Monthly payout notification sent:", result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        console.error("Failed to send email:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error:", error);
      return { success: false, error: "Unknown error occurred" };
    }
  }

  // Example 6: Send bulk email
  static async sendBulkEmail() {
    try {
      const result = await nodemailerService.sendBulkEmail({
        recipients: [
          "user1@example.com",
          "user2@example.com",
          "user3@example.com",
        ],
        templateType: 14, // Bulk Marketing Email
        variables: {
          firstName: "Valued Customer",
          announcementText:
            "We are excited to announce our new course catalog!",
          readMoreLink: "https://rihabtech.com/courses",
        },
      });

      console.log(
        `Bulk email sent: ${result.sentCount} successful, ${result.failedCount} failed`
      );
      if (result.errors.length > 0) {
        console.error("Errors:", result.errors);
      }
      return result;
    } catch (error) {
      console.error("Error:", error);
      return { success: false, error: "Unknown error occurred" };
    }
  }

  // Example 7: Test email server connection
  static async testConnection() {
    try {
      const result = await nodemailerService.testConnection();
      if (result.success) {
        console.log("Email server connection successful");
        return { success: true, message: "Connection successful" };
      } else {
        console.error("Email server connection failed:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error:", error);
      return { success: false, error: "Unknown error occurred" };
    }
  }
}

// React Component Example
export const EmailExamplesComponent: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string>("");

  const handleEmailAction = async (
    action: () => Promise<any>,
    actionName: string
  ) => {
    setLoading(true);
    setResult("");

    try {
      const response = await action();
      if (response.success) {
        setResult(
          `✅ ${actionName} successful! Message ID: ${
            response.messageId || "N/A"
          }`
        );
      } else {
        setResult(
          `❌ ${actionName} failed: ${response.error || "Unknown error"}`
        );
      }
    } catch (error) {
      setResult(`❌ ${actionName} failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Email Service Examples</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={() =>
            handleEmailAction(
              EmailUsageExamples.sendSubscriptionConfirmation,
              "Subscription Confirmation"
            )
          }
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Subscription Confirmation"}
        </button>

        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={() =>
            handleEmailAction(
              EmailUsageExamples.sendInstructorApproval,
              "Instructor Approval"
            )
          }
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Instructor Approval"}
        </button>

        <button
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={() =>
            handleEmailAction(
              EmailUsageExamples.sendCourseApproval,
              "Course Approval"
            )
          }
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Course Approval"}
        </button>

        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={() =>
            handleEmailAction(
              EmailUsageExamples.sendSubscriptionRevoked,
              "Subscription Revoked"
            )
          }
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Subscription Revoked"}
        </button>

        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={() =>
            handleEmailAction(
              EmailUsageExamples.sendMonthlyPayout,
              "Monthly Payout"
            )
          }
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Monthly Payout"}
        </button>

        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={() =>
            handleEmailAction(EmailUsageExamples.sendBulkEmail, "Bulk Email")
          }
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Bulk Email"}
        </button>

        <button
          className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={() =>
            handleEmailAction(
              EmailUsageExamples.testConnection,
              "Test Connection"
            )
          }
          disabled={loading}
        >
          {loading ? "Testing..." : "Test Email Server"}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default EmailExamplesComponent;

