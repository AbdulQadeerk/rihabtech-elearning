import { Button } from '../../components/ui/button';
import { useState, useEffect } from 'react';
import { 
  getStatusById, 
  getStatusMessage, 
  getStatusColor, 
  getStatusBackgroundColor, 
  getStatusButtonColor, 
  getStatusDescription 
} from '../../constants/instructorStatus';
import { instructorApiService } from '../../utils/instructorApiService';

export default function InstructorSignupSuccess() {
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentStatus = async () => {
      try {
        setLoading(true);
        
        // First try to get status from API
        const response = await instructorApiService.getCurrentStatus();
        
        if (
          response &&
          response.currStatus !== undefined &&
          response.currStatus !== null
        ) {
          // Get status info from constants
          const statusInfo = getStatusById(response.currStatus);
          
          const mappedStatus = {
            status: statusInfo ? statusInfo.text.toLowerCase().replace(' ', '_') : 'pending',
            statusId: response.currStatus,
            appliedAt: response.currStatusDate
              ? new Date(response.currStatusDate).toISOString()
              : new Date().toISOString(), // Use API date when available, fallback to current date
            applicationId: `api_${response.currStatus}_${Date.now()}`,
            email: 'user@example.com' // This could be enhanced to get from user context
          };
          
          setApplicationStatus(mappedStatus);
        } else {
          // Fallback to localStorage if API doesn't return status
          const statusData = localStorage.getItem('instructorApplicationStatus');
          if (statusData) {
            setApplicationStatus(JSON.parse(statusData));
          }
        }
      } catch (error) {
        console.error('Error fetching instructor status:', error);
        
        // Fallback to localStorage on error
        const statusData = localStorage.getItem('instructorApplicationStatus');
        if (statusData) {
          setApplicationStatus(JSON.parse(statusData));
        } else {
          // Default status if nothing is found
          setApplicationStatus({
            status: 'pending',
            appliedAt: new Date().toISOString(),
            applicationId: 'default_status'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentStatus();
  }, []);

  const getCurrentStatusMessage = () => {
    if (!applicationStatus) return 'Your application has been submitted';
    
    // Use statusId if available (from API), otherwise fallback to status string
    if (applicationStatus.statusId) {
      return getStatusMessage(applicationStatus.statusId);
    }
    
    // Fallback for localStorage data
    switch (applicationStatus.status) {
      case 'pending':
        return 'Your application is under review';
      case 'approved':
        return 'Congratulations! Your application has been approved';
      case 'rejected':
        return 'Your application has been rejected';
      case 'on_hold':
        return 'Your application is on hold for further review';
      default:
        return 'Your application has been submitted';
    }
  };

  const getCurrentStatusColor = () => {
    if (!applicationStatus) return 'text-blue-600';
    
    // Use statusId if available (from API), otherwise fallback to status string
    if (applicationStatus.statusId) {
      return getStatusColor(applicationStatus.statusId);
    }
    
    // Fallback for localStorage data
    switch (applicationStatus.status) {
      case 'pending':
        return 'text-orange-600';
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'on_hold':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Column - Orange Background with Illustration */}
      <div className="hidden md:flex md:w-1/2 App-Gradient-Angular flex-col items-center justify-center px-[110px] relative">
        <div className="bg-white rounded-full p-8 w-4/5 aspect-square flex items-center justify-center">
          <img
            src="Images/5243321.png"
            alt="Woman logging in securely"
            className="max-w-full"
          />
        </div>
        <div className="text-center mt-8 text-white">
          <h2 className="text-white text-[31.25px] font-bold font-['Zen_Kaku_Gothic_Antique'] leading-[37.50px] mb-2">
            Share What You Love. Help Others Grow.
          </h2>
          <p className="text-neutral-100 text-base font-normal font-['Zen_Kaku_Gothic_Antique'] leading-7">
            Turn your passion into purpose by teaching online with ZK Tutorials.
          </p>
        </div>
      </div>

      {/* Right Column - Success Message */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white rounded shadow-md p-8 text-center">
          <h1 className={`text-2xl font-bold mb-4 ${getCurrentStatusColor()}`}>
            {applicationStatus?.status === 'approved' ? 'Application Approved!' : 
             applicationStatus?.status === 'rejected' ? 'Application Update' :
             applicationStatus?.status === 'on_hold' ? 'Application On Hold' :
             'Application Submitted!'}
          </h1>
          
          <div className="mb-6">
            <p className={`text-lg font-medium mb-2 ${getCurrentStatusColor()}`}>
              {getCurrentStatusMessage()}
            </p>
            
            {applicationStatus && (
              <div className="text-sm text-gray-600 space-y-1">
                {/* <p>Application ID: <span className="font-mono text-xs">{applicationStatus.applicationId?.slice(-8) || 'N/A'}</span></p> */}
                <p>Applied on: {new Date(applicationStatus.appliedAt).toLocaleDateString()}</p>
                <p>Status: <span className={`font-semibold ${getCurrentStatusColor()}`}>
                  {applicationStatus.statusId ? getStatusById(applicationStatus.statusId)?.text : applicationStatus.status}
                </span></p>
              </div>
            )}
          </div>

          {applicationStatus && (
            (() => {
              const statusId = applicationStatus.statusId;
              if (statusId && (statusId === 1 || statusId === 2 || statusId === 3 || statusId === 4)) {
                const description = getStatusDescription(statusId);
                const bgColor = getStatusBackgroundColor(statusId);
                return (
                  <div className={`${bgColor} rounded-lg p-4 mb-6`}>
                    <p className="text-sm">
                      <strong>{description.title}</strong><br/>
                      {description.message}
                    </p>
                  </div>
                );
              } else {
                // Fallback for localStorage data
                if (applicationStatus.status === 'pending') {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-yellow-800 text-sm">
                        <strong>What's Next?</strong><br/>
                        Our admin team is reviewing your application. This usually takes 1-3 business days. 
                        You'll be notified once a decision is made.
                      </p>
                    </div>
                  );
                } else if (applicationStatus.status === 'approved') {
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <p className="text-green-800 text-sm">
                        <strong>Welcome to our instructor community!</strong><br/>
                        You can now start creating and publishing courses. Access your instructor dashboard to get started.
                      </p>
                    </div>
                  );
                } else if (applicationStatus.status === 'rejected') {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-800 text-sm">
                        <strong>Application Not Approved</strong><br/>
                        Your application didn't meet our current requirements. You can reapply after addressing any feedback provided.
                      </p>
                    </div>
                  );
                } else if (applicationStatus.status === 'on_hold') {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-yellow-800 text-sm">
                        <strong>Application Under Additional Review</strong><br/>
                        Your application is on hold for further review. Our team may need additional information or clarification. 
                        You'll be contacted if any additional steps are required.
                      </p>
                    </div>
                  );
                }
              }
              return null;
            })()
          )}

          <div className="space-y-3">
            {(() => {
              const statusId = applicationStatus?.statusId;
              const status = applicationStatus?.status;
              
              if (statusId === 2 || status === 'approved') {
                return (
                  <>
                    <Button 
                      className={`w-full ${getStatusButtonColor(2)}`} 
                      onClick={() => window.location.href = '/#/instructor/course-test-selection'}
                    >
                      Go to Instructor Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => window.location.href = '/#'}
                    >
                      Go to Homepage
                    </Button>
                  </>
                );
              } else if (statusId === 4 || status === 'on_hold') {
                return (
                  <>
                    <Button 
                      className={`w-full ${getStatusButtonColor(4)}`} 
                      onClick={() => window.location.href = '/#'}
                    >
                      Check Back Later
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => window.location.href = '/#'}
                    >
                      Go to Homepage
                    </Button>
                  </>
                );
              } else {
                return (
                  <Button 
                    className="bg-primary hover:bg-orange-600" 
                    onClick={() => window.location.href = '/#'}
                  >
                    Go to Homepage
                  </Button>
                );
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
} 