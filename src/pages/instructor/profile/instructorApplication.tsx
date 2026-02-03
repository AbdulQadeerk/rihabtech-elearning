import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Button } from "../../../components/ui/button";

interface InstructorApplicationProps {
  user: any;
  profile?: any; // Optional profile prop with instructorProfile data
}

interface ApplicationData {
  status?: string;
  experties?: string;
  topic?: string;
  PANnumber?: string;
  adhaarnumber?: string;
  aadharImage?: string;
  panImage?: string;
  userEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

const InstructorApplication: React.FC<InstructorApplicationProps> = ({
  user,
  profile,
}) => {
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>("");
  const [applicationId, setApplicationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [applicationData, setApplicationData] =
    useState<ApplicationData | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    experties: "",
    topic: "",
    PANnumber: "",
    adhaarnumber: "",
    aadharImage: "skipped-for-now",
    panImage: "skipped-for-now",
  });

  // Load data from API profile first, then check Firebase as fallback
  useEffect(() => {
    // Check if instructorProfile exists in API response
    if (profile?.instructorProfile) {
      const instructorData = profile.instructorProfile;
      console.log('Loading instructor data from API:', instructorData);
      
      // Check if instructor has applied (has areaOfExpertise or teachingTopics)
      const hasInstructorData = instructorData.areaOfExpertise || instructorData.teachingTopics || instructorData.panNo || instructorData.aadhaarNo;
      
      if (hasInstructorData) {
        setHasApplied(true);
        // Map API status to application status
        // currStatus: 1 = pending, 2 = approved/rejected (check isBlocked)
        let status = "pending";
        if (instructorData.currStatus === 2) {
          status = instructorData.isBlocked ? "rejected" : "approved";
        } else if (instructorData.currStatus === 1) {
          status = "pending";
        }
        setApplicationStatus(status);
        
        // Set application data from API (store full values for display)
        const apiApplicationData: ApplicationData = {
          experties: instructorData.areaOfExpertise || "",
          topic: instructorData.teachingTopics || "",
          PANnumber: instructorData.panNo || "",
          adhaarnumber: instructorData.aadhaarNo || "", // Store full value
          aadharImage: instructorData.aadhaarFile || "skipped-for-now",
          panImage: instructorData.panFile || "skipped-for-now",
        };
        
        setApplicationData(apiApplicationData);
        
        // Pre-populate form data (store full values for editing)
        setFormData({
          experties: instructorData.areaOfExpertise || "",
          topic: instructorData.teachingTopics || "",
          PANnumber: instructorData.panNo || "",
          adhaarnumber: instructorData.aadhaarNo || "", // Store full value for editing
          aadharImage: instructorData.aadhaarFile || "skipped-for-now",
          panImage: instructorData.panFile || "skipped-for-now",
        });
        
        setLoading(false);
        return; // Don't check Firebase if API data exists
      }
    }
    
    // Fallback to Firebase check if no API data
    if (user?.UserName) {
      checkExistingApplication(user.UserName);
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const checkExistingApplication = async (userEmail: string) => {
    try {
      console.log("Checking for existing applications for:", userEmail);

      if (!userEmail || typeof userEmail !== "string") {
        console.log("Invalid email provided");
        setLoading(false);
        return;
      }

      const instructorRequestsRef = collection(db, "instructor_requests");
      const q = query(
        instructorRequestsRef,
        where("userEmail", "==", userEmail)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data() as ApplicationData;
        console.log("Found existing application:", data);

        setHasApplied(true);
        setApplicationStatus(data.status || "pending");
        setApplicationId(doc.id);
        setApplicationData(data);

        // Pre-populate form data for editing
        setFormData({
          experties: data.experties || "",
          topic: data.topic || "",
          PANnumber: data.PANnumber || "",
          adhaarnumber: data.adhaarnumber || "",
          aadharImage: data.aadharImage || "skipped-for-now",
          panImage: data.panImage || "skipped-for-now",
        });
      } else {
        console.log("No existing application found");
        setHasApplied(false);
      }
    } catch (error) {
      console.error("Error checking existing applications:", error);
      setHasApplied(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.UserName) {
      toast.error("Please log in to apply as an instructor");
      return;
    }

    if (hasApplied && !isEditMode) {
      toast.info("You have already applied to become an instructor");
      return;
    }

    setSubmitting(true);

    try {
      // Validate required fields
      if (
        !formData.experties ||
        !formData.topic ||
        !formData.PANnumber ||
        !formData.adhaarnumber
      ) {
        toast.error("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      // Validate PAN format
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(formData.PANnumber)) {
        toast.error("Please enter a valid PAN number (e.g., ABCDE1234F)");
        setSubmitting(false);
        return;
      }

      // Validate Aadhar format
      const aadharRegex = /^[0-9]{12}$/;
      if (!aadharRegex.test(formData.adhaarnumber)) {
        toast.error("Please enter a valid 12-digit Aadhar number");
        setSubmitting(false);
        return;
      }

      // Create instructor request document
      const instructorRequest = {
        userEmail: user.UserName,
        instructorId: user.UserName,
        userName: user.Name || "",
        experties: formData.experties.trim(),
        topic: formData.topic.trim(),
        PANnumber: formData.PANnumber.toUpperCase().trim(),
        adhaarnumber: formData.adhaarnumber.trim(),
        aadharImage: formData.aadharImage,
        panImage: formData.panImage,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("Submitting instructor request:", instructorRequest);

      const docRef = await addDoc(
        collection(db, "instructor_requests"),
        instructorRequest
      );
      console.log("Document written with ID: ", docRef.id);

      setHasApplied(true);
      setApplicationStatus("pending");
      setApplicationId(docRef.id);

      if (isEditMode) {
        toast.success(
          "Your instructor application has been updated successfully!"
        );

        // Update the displayed application data
        const updatedData = {
          ...applicationData,
          experties: formData.experties.trim(),
          topic: formData.topic.trim(),
          PANnumber: formData.PANnumber.toUpperCase().trim(),
          adhaarnumber: formData.adhaarnumber.trim(),
          updatedAt: new Date().toISOString(),
        };
        setApplicationData(updatedData);

        // Close edit mode
        setIsEditMode(false);
      } else {
        toast.success(
          "Your instructor application has been submitted successfully!"
        );

        setFormData({
          experties: "",
          topic: "",
          PANnumber: "",
          adhaarnumber: "",
          aadharImage: "skipped-for-now",
          panImage: "skipped-for-now",
        });
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-sm font-medium ${
          statusClasses[status as keyof typeof statusClasses] ||
          statusClasses.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E6E6E6] shadow-sm p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading application status...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E6E6E6] mt-[32px] shadow-sm p-6">
      {hasApplied ? (
        <div>
          {!isEditMode ? (
            // Display mode - Show details in label-value format
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Instructor Application
                </h3>
                {/* <Button
                  onClick={() => setIsEditMode(true)}
                  variant="outline"
                  className="border-[#ff7700] text-[#ff7700] hover:bg-[#fff7ef]"
                >
                  Edit
                </Button> */}
              </div>

              {/* Application Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  {/* <div>
                    <p className="text-gray-600 mb-2">Application Status</p>
                    <p className="text-sm text-gray-500">
                      Application ID: {applicationId}
                    </p>
                  </div> */}
                  <div className="text-right">
                    {getStatusBadge(applicationStatus)}
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expertise
                  </label>
                  <p className="text-gray-900 font-medium">
                    {applicationData?.experties || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teaching Topic
                  </label>
                  <p className="text-gray-900 font-medium">
                    {applicationData?.topic || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number
                  </label>
                  <p className="text-gray-900 font-medium">
                    {applicationData?.PANnumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Number
                  </label>
                  <p className="text-gray-900 font-medium">
                    {applicationData?.adhaarnumber
                      ? `****-****-${applicationData.adhaarnumber.slice(-4)}`
                      : "Not provided"}
                  </p>
                </div>
              </div>

              {/* Status Messages */}
              {applicationStatus === "pending" && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm">
                    <strong>Your application is under review.</strong> We'll
                    notify you once it's been processed by our admin team.
                  </p>
                </div>
              )}

              {applicationStatus === "approved" && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">
                    <strong>Congratulations!</strong> Your instructor
                    application has been approved. You can now start creating
                    courses.
                  </p>
                  <button
                    onClick={() =>
                      (window.location.href = "/#/instructor/dashboard")
                    }
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                  >
                    Go to Instructor Dashboard
                  </button>
                </div>
              )}

              {applicationStatus === "rejected" && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">
                    <strong>Application Not Approved.</strong> Unfortunately,
                    your instructor application was not approved at this time.
                    Please contact support for more information.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Edit mode - Show the existing form
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Instructor Application
                </h3>
                <Button
                  onClick={() => setIsEditMode(false)}
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="experties"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Expertise <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="experties"
                      name="experties"
                      value={formData.experties}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. Web Development, UI/UX Design"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="topic"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Teaching Topic <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. React, Figma, JavaScript"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="PANnumber"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      PAN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="PANnumber"
                      name="PANnumber"
                      value={formData.PANnumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      style={{ textTransform: "uppercase" }}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: ABCDE1234F
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="adhaarnumber"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Aadhar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="adhaarnumber"
                      name="adhaarnumber"
                      value={formData.adhaarnumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="123456789012"
                      maxLength={12}
                      pattern="[0-9]{12}"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      12-digit Aadhar number
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Document Upload
                  </h4>
                  <p className="text-sm text-blue-700">
                    Document upload functionality will be available after
                    initial application approval. For now, your application will
                    be processed with the provided information.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    <span className="text-red-500">*</span> Required fields
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      variant="outline"
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Updating..." : "Update Application"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        // Show dummy data for users who haven't applied yet
        <div>
          {!isEditMode ? (
            // Display mode - Show dummy details in label-value format
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Apply to Become an Instructor
                </h3>
                <Button
                  onClick={() => setIsEditMode(true)}
                  variant="outline"
                  className="border-[#ff7700] text-[#ff7700] hover:bg-[#fff7ef]"
                >
                  Edit
                </Button>
              </div>

              {/* Dummy Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expertise
                  </label>
                  <p className="text-gray-900 font-medium">
                    Web Development, UI/UX Design
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teaching Topic
                  </label>
                  <p className="text-gray-900 font-medium">
                    React, Figma, JavaScript
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number
                  </label>
                  <p className="text-gray-900 font-medium">ABCDE1234F</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Number
                  </label>
                  <p className="text-gray-900 font-medium">****-****-9012</p>
                </div>
              </div>

              {/* Information Message */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800 text-sm">
                  <strong>Ready to become an instructor?</strong> Click the Edit
                  button above to fill in your actual details and submit your
                  application.
                </p>
              </div>
            </div>
          ) : (
            // Edit mode - Show the actual form
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Apply to Become an Instructor
                </h3>
                <Button
                  onClick={() => setIsEditMode(false)}
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="experties"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Expertise <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="experties"
                      name="experties"
                      value={formData.experties}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. Web Development, UI/UX Design"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="topic"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Teaching Topic <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. React, Figma, JavaScript"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="PANnumber"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      PAN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="PANnumber"
                      name="PANnumber"
                      value={formData.PANnumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      style={{ textTransform: "uppercase" }}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: ABCDE1234F
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="adhaarnumber"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Aadhar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="adhaarnumber"
                      name="adhaarnumber"
                      value={formData.adhaarnumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="123456789012"
                      maxLength={12}
                      pattern="[0-9]{12}"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      12-digit Aadhar number
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Document Upload
                  </h4>
                  <p className="text-sm text-blue-700">
                    Document upload functionality will be available after
                    initial application approval. For now, your application will
                    be processed with the provided information.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    <span className="text-red-500">*</span> Required fields
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      variant="outline"
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstructorApplication;
