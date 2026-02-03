import React, { useState } from 'react';
import { Bell, BellIcon, Film } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';



// Mock notification data
const mockNotifications: any[] = [
  // {
  //   id: 1,
  //   type: 'instructor',
  //   title: 'The lecture that you requested to be deleted is now deleted.',
  //   timestamp: '5 days ago',
  //   isRead: false,
  //   icon: '🏠'
  // },
  // {
  //   id: 4,
  //   type: 'student',
  //   title: 'Your course enrollment was successful!',
  //   timestamp: '2 days ago',
  //   isRead: false,
  //   icon: '🎓'
  // },
];

const NotificationItem = ({ notification, onMarkAsRead }: any) => {
  return (
    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
      {/* Udemy Logo/Icon */}
      <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
          {/* <span className="text-primary font-bold text-lg">U</span> */}
          <Film className='text-primary' />
        </div>
      </div>

      {/* Notification Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-relaxed">
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {notification.timestamp}
        </p>
      </div>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
        </div>
      )}
    </div>
  );
};

const NotificationsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('instructor');
  const [notifications, setNotifications] = useState(mockNotifications);

  // Get role from localStorage
  const getUserRole = () => {
    try {
      const tokenData = localStorage.getItem('token');
      if (tokenData) {
        const userData = JSON.parse(tokenData);
        return userData.Role || null;
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return null;
  };

  const userRole = getUserRole();
  const isStudent = userRole === 4;
  const isInstructor = userRole === 5;

  const instructorNotifications = notifications.filter(n => n.type === 'instructor');
  const studentNotifications = notifications.filter(n => n.type === 'student');

  // For student: show only student notifications, for instructor: show all notifications for unread count
  const allNotifications = isStudent ? studentNotifications : notifications;
  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleSeeAll = () => {
    console.log('See all notifications');
    window.location.href = '/#/learner/notifications'
    // Navigate to full notifications page
  };

  const getActiveNotifications = () => {
    if (isStudent) {
      // Student: show only student notifications
      return studentNotifications;
    } else if (isInstructor) {
      // Instructor: show based on active tab
      return activeTab === 'instructor' ? instructorNotifications : studentNotifications;
    }
    // Default fallback
    return notifications;
  };

  return (
    <>


      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          //variant="ghost"
          onClick={() => setIsOpen(true)}
          className="relative p-0 ml-4 cursor-pointer"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0">
              {unreadCount}
            </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent className='bg-white w-full'>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <div className="flex items-center space-x-2">
              {/* <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button> */}
              {/* <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button> */}
            </div>
          </div>

          {/* Tabs - Only show for instructors */}
          {isInstructor && (
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('instructor')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'instructor'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Instructor ({instructorNotifications.length})
              </button>
              <button
                onClick={() => setActiveTab('student')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'student'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Student ({studentNotifications.length})
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {getActiveNotifications().length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-sm text-gray-500">
                  {isStudent
                    ? "You're all caught up! No notifications at the moment."
                    : activeTab === 'instructor'
                      ? "You're all caught up! No instructor notifications at the moment."
                      : "You're all caught up! No student notifications at the moment."
                  }
                </p>
              </div>
            ) : (
              <div>
                {getActiveNotifications().map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => { }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {getActiveNotifications().length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="ghost"
                onClick={handleMarkAllAsRead}
                className="text-primary hover:text-orange-400 p-0 h-auto font-medium"
              >
                Mark all as read
              </Button>
              <Button
                variant="outline"
                onClick={handleSeeAll}
                className="text-primary border-primary hover:bg-purple-50"
              >
                See all
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
};

export default NotificationsDialog;