import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical,
  Phone,
  Video,
  User,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../context/AuthContext';
import { chatService, ChatConversation, ChatMessage, ChatStats } from '../../../utils/chatService';
import { toast } from 'sonner';
import AnnouncementModule from './announcementModule';
import AssignmentTab from './assignmentTab';
import { Trash2 } from 'lucide-react';

export default function ChatInterface() {
  const [activeTab, setActiveTab] = useState("Messages");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [isSending, setIsSending] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user?.UserName) {
        console.log('No user.UserName available for instructor:', user);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Loading conversations for instructor:', user.UserName);
        const [conversationsData, statsData, coursesData] = await Promise.all([
          chatService.getConversations(user.UserName),
          chatService.getChatStats(user.UserName),
          chatService.getConversationCourses(user.UserName)
        ]);
        console.log('Loaded instructor conversations:', conversationsData);
        console.log('Loaded instructor courses:', coursesData);
        
        setConversations(conversationsData);
        setStats(statsData);
        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading chat data:', error);
        toast.error('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Add a manual refresh function that can be called when needed
    const refreshData = async () => {
      if (user?.UserName) {
        try {
          console.log('Refreshing instructor data...');
          const [conversationsData, statsData, coursesData] = await Promise.all([
            chatService.getConversations(user.UserName),
            chatService.getChatStats(user.UserName),
            chatService.getConversationCourses(user.UserName)
          ]);
          setConversations(conversationsData);
          setStats(statsData);
          setCourses(coursesData);
          console.log('Instructor data refreshed:', conversationsData);
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      }
    };
    
    // Store refresh function globally for external calls
    (window as any).refreshInstructorChat = refreshData;
    
    return () => {
      delete (window as any).refreshInstructorChat;
    };
  }, [user?.UserName]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadMessages = async (conversationId: string) => {
    try {
      const messagesData = await chatService.getConversationMessages(conversationId);
      setMessages(messagesData);
      
      // Mark messages as read
      if (user?.UserName) {
        await chatService.markMessagesAsRead(conversationId, user.UserName);
        // Update conversation unread count
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !user?.UserName) return;

    try {
      setIsSending(true);
      const messageData = {
        conversationId: selectedConversation.id,
        senderId: user.UserName,
        senderName: 'You',
        senderRole: 'instructor' as const,
        message: newMessage.trim(),
        isRead: false,
        messageType: 'text' as const
      };

      await chatService.sendMessage(messageData);
      
      // Add message to local state immediately
      const message: ChatMessage = {
        id: Date.now().toString(),
        ...messageData,
        timestamp: new Date()
      };
      
      // Update messages immediately
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update conversation in list immediately
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, lastMessage: newMessage.trim(), lastMessageTime: new Date(), updatedAt: new Date() }
          : conv
      ));
      
      // Refresh learner chat if it's open to show unread count
      if ((window as any).refreshLearnerChat) {
        (window as any).refreshLearnerChat();
      }
      
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations based on search and course selection
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      conv.participantNames.some(name => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || 
      conv.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === "all" || conv.courseId === selectedCourse;
    
    return matchesSearch && matchesCourse;
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex space-x-2">
          {["Messages", "Assignment", "Announcements"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-[15px] font-medium rounded-[35px] shadow-sm border ${
                activeTab === tab
                  ? "bg-primary text-white border-primary"
                  : "text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Messages' && (
  <div className="flex-1 flex min-h-0">
          {/* Conversations Sidebar */}
          <div className="w-80 bg-white border-r flex flex-col min-h-0">
            {/* Stats */}
            {stats && (
              <div className="p-4 border-b bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{stats.totalConversations}</p>
                    <p className="text-gray-600">Conversations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.unreadMessages}</p>
                    <p className="text-gray-600">Unread</p>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Course Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Course:</span>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Courses</option>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))
                  ) : (
                    <option value="no-courses" disabled>No courses available</option>
                  )}
                </select>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No conversations found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-primary' : ''
                      } ${
                        conversation.unreadCount > 0 ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                            {conversation.participantNames[1]?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {conversation.participantNames[1] || 'Student'}
                            </p>
                            <p className="text-xs text-gray-500">{conversation.courseName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${conversation.unreadCount > 0 ? 'text-primary font-semibold' : 'text-gray-500'}`}>
                            {formatTime(conversation.lastMessageTime)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="ml-2 bg-primary text-white text-xs font-bold min-w-[20px] text-center">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{conversation.lastMessage}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedConversation ? (
              <div className='relative flex flex-col h-full'>
                {/* Chat Header */}
                <div className="bg-white border-b p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                      {selectedConversation.participantNames[1]?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedConversation.participantNames[1] || 'Student'}
                      </p>
                      <p className="text-sm text-gray-500">{selectedConversation.courseName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                     <Trash2 className="text-red mr-2"/> Delete Conversation
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderRole === 'instructor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderRole === 'instructor'
                              ? 'bg-primary text-white'
                              : 'bg-white text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs opacity-75">{message.senderName}</span>
                            <span className="text-xs opacity-75">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input - sticky within chat column */}
                <div className="sticky bottom-0 bg-white border-t p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    {/* <Button variant="outline" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button> */}
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="w-full sm:flex-1 px-3 py-2 border border-solid border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <div className="flex-shrink-0">
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                        size="sm"
                      >
                        {isSending ? 'Sending...' : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Assignment' && <AssignmentTab />}

      {activeTab === 'Announcements' && (
        <AnnouncementModule/>
      )}
    </div>
  );
}