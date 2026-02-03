import { useState, useEffect } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../context/AuthContext';
import { chatService, ChatConversation, ChatMessage } from '../../../utils/chatService';
import { toast } from 'sonner';


const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white">
    <span className="text-sm font-semibold">MA</span>
  </div>
);

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const loadConversations = async () => {
      if (!user?.UserName) {
        console.log('No user.UserName available:', user);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Loading conversations for user:', user.UserName);
        const conversationsData = await chatService.getConversations(user.UserName);
        console.log('Loaded conversations:', conversationsData);
        setConversations(conversationsData);
        
        // Check for conversationId in URL (handle hash-based routing)
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const conversationId = urlParams.get('conversationId');

        console.log('Hash:', hash);
        console.log('ConversationId from URL:', conversationId);
        console.log('Available conversations:', conversationsData);

        if (conversationId) {
          let conversation = conversationsData.find(conv => conv.id === conversationId);
          console.log('Found conversation:', conversation);

          if (conversation) {
            setSelectedConversation(conversation);
            await loadMessages(conversationId);
          } else {
            console.log('Conversation not found in list, trying to get by ID...');
            // Try to get the conversation directly by ID
            try {
              const directConversation = await chatService.getConversationById(conversationId);
              if (directConversation) {
                console.log('Found conversation by ID:', directConversation);
                setSelectedConversation(directConversation);
                await loadMessages(conversationId);
                // Also update the conversations list
                setConversations(prev => [directConversation, ...prev.filter(conv => conv.id !== conversationId)]);
              } else {
                console.log('Conversation not found by ID either, retrying in 2 seconds...');
                // Retry after a short delay in case of timing issues
                setTimeout(async () => {
                  try {
                    if (!user?.UserName) {
                      console.log('User not available for retry');
                      return;
                    }
                    const retryConversations = await chatService.getConversations(user.UserName);
                    setConversations(retryConversations);
                    const retryConversation = retryConversations.find(conv => conv.id === conversationId);
                    if (retryConversation) {
                      console.log('Found conversation on retry:', retryConversation);
                      setSelectedConversation(retryConversation);
                      await loadMessages(conversationId);
                    } else {
                      console.log('Conversation still not found after retry');
                      toast.error('Conversation not found. Please try again.');
                    }
                  } catch (retryError) {
                    console.error('Error on retry:', retryError);
                    toast.error('Failed to load conversation. Please try again.');
                  }
                }, 2000);
              }
            } catch (directError) {
              console.error('Error getting conversation by ID:', directError);
              toast.error('Failed to load conversation. Please try again.');
            }
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    
    // Add a manual refresh function that can be called when needed
    const refreshConversations = async () => {
      if (user?.UserName) {
        try {
          console.log('Refreshing learner conversations...');
          const conversationsData = await chatService.getConversations(user.UserName);
          setConversations(conversationsData);
          console.log('Learner conversations refreshed:', conversationsData);
        } catch (error) {
          console.error('Error refreshing conversations:', error);
        }
      }
    };
    
    // Store refresh function globally for external calls
    (window as any).refreshLearnerChat = refreshConversations;
    
    return () => {
      delete (window as any).refreshLearnerChat;
    };
  }, [user?.UserName]);

  // Also listen for hash changes to handle navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(hash.split('?')[1] || '');
      const conversationId = urlParams.get('conversationId');
      
      if (conversationId && conversations.length > 0) {
        const conversation = conversations.find(conv => conv.id === conversationId);
        if (conversation) {
          setSelectedConversation(conversation);
          loadMessages(conversationId);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [conversations]);

  const loadMessages = async (conversationId: string) => {
    try {
      const messagesData = await chatService.getConversationMessages(conversationId);
      setMessages(messagesData);
      
      // Mark messages as read when conversation is selected
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
    if (!message.trim() || !selectedConversation || !user?.UserName) return;

    try {
      setIsSending(true);
      const messageData = {
        conversationId: selectedConversation.id,
        senderId: user.UserName,
        senderName: user.UserName,
        senderRole: 'student' as const,
        message: message.trim(),
        isRead: false,
        messageType: 'text' as const
      };

      await chatService.sendMessage(messageData);
      
      // Add message to local state immediately
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        ...messageData,
        timestamp: new Date()
      };
      
      // Update messages immediately
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // Update conversation's last message and timestamp immediately
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { 
              ...conv, 
              lastMessage: newMessage.message, 
              lastMessageTime: new Date(),
              updatedAt: new Date()
            }
          : conv
      ));
      
      // Refresh instructor chat if it's open to show unread count
      if ((window as any).refreshInstructorChat) {
        (window as any).refreshInstructorChat();
      }
      
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations based on search only
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      conv.participantNames.some(name => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || 
      conv.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="flex w-full h-screen bg-gray-50">
      

      {/* Main Content */}
      <div className="flex w-full">
        {/* Left sidebar - Chat list */}
        <div className="w-1/3 border-r border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Messeges</h2>
            <div className="mt-4 flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 outline outline-2 outline-gray-300 bg-white rounded-[10px]"
                />
                <div className="absolute inset-y-0 left-2 flex items-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto h-full max-h-[calc(100vh-12rem)]">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>{conversations.length === 0 ? 'No conversations yet' : 'No conversations match your filters'}</p>
              </div>
            ) : (
              filteredConversations.map((conversation, index) => (
                <div
                  key={conversation.id}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id ? 'bg-white rounded-[10px] border border-[#dfe0eb] shadow-[0px_0px_8px_0px_rgba(255,119,0,0.29)]' : ''
                  } ${
                    conversation.unreadCount > 0 ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                }`}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    loadMessages(conversation.id);
                  }}
              >
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                    {conversation.participantNames.find(name => name !== user?.UserName)?.charAt(0) || 'I'}
                  </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <div className='flex flex-col justify-between'>
                        <p className="text-black text-sm font-semibold font-['Public_Sans']">
                          {conversation.participantNames.find(name => name !== user?.UserName) || 'Instructor'}
                        </p>
                        <p className="text-xs text-gray-500">{conversation.courseName || 'General Chat'}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        {conversation.unreadCount > 0 && (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary text-white font-bold min-w-[20px] text-center">
                            {conversation.unreadCount}
                      </span>
                        )}
                        <p className={`text-xs ${conversation.unreadCount > 0 ? 'text-primary font-semibold' : 'text-gray-500'}`}>
                          {conversation.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className={`${conversation.unreadCount > 0 ? 'text-primary' : 'text-gray-400'}`}>▶</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right side - Chat conversation */}
        <div className="w-2/3 flex flex-col bg-white">
          {selectedConversation ? (
            <>
          {/* Chat header */}
          <div className="p-4 border-b border-gray-200 flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                  {selectedConversation.participantNames.find(name => name !== user?.UserName)?.charAt(0) || 'I'}
                </div>
            <div className="ml-3">
                  <p className="font-semibold">
                    {selectedConversation.participantNames.find(name => name !== user?.UserName) || 'Instructor'}
                  </p>
                  <p className="text-xs text-gray-500">{selectedConversation.courseName || 'General Chat'}</p>
            </div>
            <div className="ml-auto">
              <span className="text-primary font-bold">●</span>
            </div>
          </div>
            </>
          ) : (
            <div className="p-4 border-b border-gray-200 flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
                ?
              </div>
              <div className="ml-3">
                <p className="font-semibold">Select a conversation</p>
                <p className="text-xs text-gray-500">Choose a conversation to start chatting</p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {selectedConversation ? (
            <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderRole === 'student' ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex items-center space-x-2 max-w-md">
                        {msg.senderRole === 'instructor' && (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {msg.senderName.charAt(0)}
                          </div>
                        )}
                    <div className='flex flex-col gap-2'>
                    <div 
                      className={`px-4 py-2 rounded-lg text-sm ${
                              msg.senderRole === 'student' 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-white rounded-[10px] border border-primary text-primary rounded-bl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                          <div className="text-[#333333] text-[10px] font-normal font-['Public_Sans']">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {msg.senderRole === 'student' && <UserAvatar />}
                      </div>
                    </div>
                  ))
                )}
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

          {/* Message input */}
          {selectedConversation && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-1 border border-primary bg-white rounded-[10px] p-2 flex items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 outline-none border-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isSending}
                />
                <div className="flex items-center space-x-2">
                <button 
                    className="text-primary hover:text-gray-700"
                      onClick={() => {/* Logic for attach file */}}
                  >
                      <img src='Images/icons/attach-file.png' alt="Attach file" className='h-6 w-6'/>
                  </button>
                  <button 
                    className="text-primary hover:text-gray-700"
                      onClick={() => {/* Logic for other actions */}}
                  >
                      <img src='Images/icons/check.png' alt="Check" className='h-6 w-6'/>
                  </button>
                  <Button 
                      className={`p-1.5 ${message.trim() ? 'bg-primary text-white' : 'bg-gray-300 text-gray-500'}`}
                    onClick={handleSendMessage}
                      disabled={!message.trim() || isSending}
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <img src='Images/icons/send.png' alt="Send" className='h-6 w-6'/>
                      )}
                  </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}