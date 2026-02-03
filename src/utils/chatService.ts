import { db } from '../lib/firebase';
import { collection, getDocs, getDoc, query, where, orderBy, addDoc, updateDoc, doc, serverTimestamp, Timestamp, writeBatch, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'instructor' | 'student' | 'admin';
  message: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
  messageType: 'text' | 'file' | 'image' | 'link';
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  courseId?: string;
  courseName?: string;
}

// Type for creating conversations (without undefined values)
export interface CreateConversationData {
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isActive: boolean;
  courseId?: string;
  courseName?: string;
}

export interface ChatStats {
  totalConversations: number;
  unreadMessages: number;
  activeChats: number;
  totalMessages: number;
}

class ChatService {
  private readonly CONVERSATIONS_COLLECTION = 'chatConversations';
  private readonly MESSAGES_COLLECTION = 'chatMessages';

  // Get all conversations for a user (instructor or learner)
  async getConversations(userId: string): Promise<ChatConversation[]> {
    try {
      console.log('Getting conversations for user:', userId);
      // First get all conversations with the user as participant (without orderBy to avoid index requirement)
      const conversationsQuery = query(
        collection(db, this.CONVERSATIONS_COLLECTION),
        where('participants', 'array-contains', userId)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);

      console.log('Found conversations count:', conversationsSnapshot.size);

      if (conversationsSnapshot.empty) {
        console.log('No conversations found, returning empty array');
        return [];
      }

      const conversations: ChatConversation[] = [];
      conversationsSnapshot.forEach(doc => {
        const data = doc.data() as any;
        const conversation = {
          id: doc.id,
          participants: data.participants || [],
          participantNames: data.participantNames || [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          unreadCount: data.unreadCount || 0,
          isActive: data.isActive || true,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          courseId: data.courseId,
          courseName: data.courseName
        };
        conversations.push(conversation);
        console.log('Added conversation:', conversation.id, 'participants:', conversation.participants);
      });

      // Sort conversations by updatedAt in descending order (most recent first)
      conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      console.log('Returning conversations:', conversations.length);
      return conversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  // Find existing conversation by participants and course
  async findExistingConversation(
    instructorId: string, 
    learnerId: string, 
    courseId?: string
  ): Promise<ChatConversation | null> {
    try {
      console.log('Searching for existing conversation:', { instructorId, learnerId, courseId });
      
      // Search from instructor's perspective
      const instructorConversations = await this.getConversations(instructorId);
      let existingConversation = instructorConversations.find(conv => {
        const hasBothParticipants = conv.participants.includes(instructorId) && 
                                   conv.participants.includes(learnerId);
        
        if (courseId && courseId.trim() !== "") {
          return hasBothParticipants && conv.courseId === courseId.trim();
        }
        
        return hasBothParticipants;
      });

      if (existingConversation) {
        console.log('Found existing conversation from instructor perspective:', existingConversation.id);
        return existingConversation;
      }

      // Search from learner's perspective
      const learnerConversations = await this.getConversations(learnerId);
      existingConversation = learnerConversations.find(conv => {
        const hasBothParticipants = conv.participants.includes(instructorId) && 
                                   conv.participants.includes(learnerId);
        
        if (courseId && courseId.trim() !== "") {
          return hasBothParticipants && conv.courseId === courseId.trim();
        }
        
        return hasBothParticipants;
      });

      if (existingConversation) {
        console.log('Found existing conversation from learner perspective:', existingConversation.id);
        return existingConversation;
      }

      console.log('No existing conversation found');
      return null;
    } catch (error) {
      console.error('Error finding existing conversation:', error);
      return null;
    }
  }

  // Get a specific conversation by ID
  async getConversationById(conversationId: string): Promise<ChatConversation | null> {
    try {
      console.log('Getting conversation by ID:', conversationId);
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationSnapshot = await getDoc(conversationRef);

      if (!conversationSnapshot.exists()) {
        console.log('Conversation not found:', conversationId);
        return null;
      }

      const data = conversationSnapshot.data() as any;
      const conversation = {
        id: conversationSnapshot.id,
        participants: data.participants || [],
        participantNames: data.participantNames || [],
        lastMessage: data.lastMessage || '',
        lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
        unreadCount: data.unreadCount || 0,
        isActive: data.isActive || true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        courseId: data.courseId,
        courseName: data.courseName
      };

      console.log('Found conversation:', conversation);
      return conversation;
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      return null;
    }
  }

  // Get messages for a specific conversation
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const messagesQuery = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      const messages: ChatMessage[] = [];
      messagesSnapshot.forEach(doc => {
        const data = doc.data() as any;
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          message: data.message,
          timestamp: data.timestamp?.toDate() || new Date(),
          isRead: data.isRead || false,
          attachments: data.attachments || [],
          messageType: data.messageType || 'text'
        });
      });

      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'> & { conversationId: string }): Promise<void> {
    try {
      await addDoc(collection(db, this.MESSAGES_COLLECTION), {
        ...messageData,
        timestamp: serverTimestamp()
      });

      // Get the conversation to update unread count
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, messageData.conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data();
        if (conversationData) {
          const participants = conversationData.participants || [];
          
          // Find the recipient (the other participant)
          const recipient = participants.find((p: string) => p !== messageData.senderId);
          
          if (recipient) {
            // Update conversation's last message, timestamp, and increment unread count for recipient
            await updateDoc(conversationRef, {
              lastMessage: messageData.message,
              lastMessageTime: serverTimestamp(),
              updatedAt: serverTimestamp(),
              unreadCount: (conversationData.unreadCount || 0) + 1
            });
            
            console.log('Updated conversation with unread count:', (conversationData.unreadCount || 0) + 1);
          } else {
            // Fallback if recipient not found
            await updateDoc(conversationRef, {
              lastMessage: messageData.message,
              lastMessageTime: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const messagesQuery = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId),
        where('isRead', '==', false)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const batch = writeBatch(db);

      messagesSnapshot.forEach(docSnapshot => {
        batch.update(doc(db, this.MESSAGES_COLLECTION, docSnapshot.id), { isRead: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Create a new conversation
  async createConversation(conversationData: CreateConversationData): Promise<ChatConversation> {
    try {
      console.log('Attempting to create conversation with data:', conversationData);
      
      // Validate required fields
      if (!conversationData.participants || conversationData.participants.length === 0) {
        throw new Error('Participants array is required and cannot be empty');
      }
      
      if (!conversationData.participantNames || conversationData.participantNames.length === 0) {
        throw new Error('Participant names array is required and cannot be empty');
      }

      // Filter out undefined values to prevent Firebase errors
      const cleanData = Object.fromEntries(
        Object.entries(conversationData).filter(([_, value]) => value !== undefined)
      );

      console.log('Cleaned conversation data:', cleanData);

      const conversationRef = await addDoc(collection(db, this.CONVERSATIONS_COLLECTION), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Conversation created successfully with ID:', conversationRef.id);

      return {
        ...conversationData,
        id: conversationRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error('Permission denied. Please check your authentication status.');
        } else if (error.message.includes('unavailable')) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        } else if (error.message.includes('invalid-argument')) {
          throw new Error('Invalid data provided. Please check your input.');
        } else if (error.message.includes('Unsupported field value: undefined')) {
          throw new Error('Invalid data: undefined values are not allowed. Please check your input data.');
        }
      }
      
      throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get unique courses from conversations
  async getConversationCourses(userId: string): Promise<{ id: string; name: string }[]> {
    try {
      const conversations = await this.getConversations(userId);
      const uniqueCourses = Array.from(new Set(conversations.map(conv => conv.courseId)))
        .filter(Boolean)
        .map(courseId => {
          const conversation = conversations.find(conv => conv.courseId === courseId);
          return {
            id: courseId!,
            name: conversation?.courseName || 'Unknown Course'
          };
        });
      return uniqueCourses;
    } catch (error) {
      console.error('Error getting conversation courses:', error);
      return [];
    }
  }

  // Get chat statistics
  async getChatStats(instructorId: string): Promise<ChatStats> {
    try {
      const conversations = await this.getConversations(instructorId);

      const totalConversations = conversations.length;
      const unreadMessages = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
      const activeChats = conversations.filter(conv => conv.isActive).length;

      // Count total messages (this would need a separate query in production)
      const totalMessages = conversations.length * 5; // Mock calculation

      return {
        totalConversations,
        unreadMessages,
        activeChats,
        totalMessages
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      return this.getMockChatStats();
    }
  }

  // Mock data methods
  private getMockConversations(instructorId: string): ChatConversation[] {
    return [
      {
        id: '1',
        participants: [instructorId, 'student1'],
        participantNames: ['You', 'John Smith'],
        lastMessage: 'Thank you for the clarification on the assignment!',
        lastMessageTime: new Date('2025-01-23T10:30:00'),
        unreadCount: 0,
        isActive: true,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-23T10:30:00'),
        courseId: 'course1',
        courseName: 'React Fundamentals'
      },
      {
        id: '2',
        participants: [instructorId, 'student2'],
        participantNames: ['You', 'Sarah Johnson'],
        lastMessage: 'When will the next module be available?',
        lastMessageTime: new Date('2025-01-23T09:15:00'),
        unreadCount: 1,
        isActive: true,
        createdAt: new Date('2025-01-18'),
        updatedAt: new Date('2025-01-23T09:15:00'),
        courseId: 'course1',
        courseName: 'React Fundamentals'
      },
      {
        id: '3',
        participants: [instructorId, 'student3'],
        participantNames: ['You', 'Mike Davis'],
        lastMessage: 'I completed the project. Can you review it?',
        lastMessageTime: new Date('2025-01-22T16:45:00'),
        unreadCount: 0,
        isActive: true,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-22T16:45:00'),
        courseId: 'course2',
        courseName: 'Advanced JavaScript'
      },
      {
        id: '4',
        participants: [instructorId, 'student4'],
        participantNames: ['You', 'Emily Wilson'],
        lastMessage: 'The course material is excellent!',
        lastMessageTime: new Date('2025-01-21T14:20:00'),
        unreadCount: 0,
        isActive: false,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-21T14:20:00'),
        courseId: 'course2',
        courseName: 'Advanced JavaScript'
      },
      {
        id: '5',
        participants: [instructorId, 'student5'],
        participantNames: ['You', 'Alex Chen'],
        lastMessage: 'Can you help me with the authentication setup?',
        lastMessageTime: new Date('2025-01-24T11:20:00'),
        unreadCount: 2,
        isActive: true,
        createdAt: new Date('2025-01-22'),
        updatedAt: new Date('2025-01-24T11:20:00'),
        courseId: 'course3',
        courseName: 'Node.js Backend Development'
      },
      {
        id: '6',
        participants: [instructorId, 'student6'],
        participantNames: ['You', 'Lisa Rodriguez'],
        lastMessage: 'The project deadline is approaching. Any tips?',
        lastMessageTime: new Date('2025-01-24T08:45:00'),
        unreadCount: 0,
        isActive: true,
        createdAt: new Date('2025-01-19'),
        updatedAt: new Date('2025-01-24T08:45:00'),
        courseId: 'course1',
        courseName: 'React Fundamentals'
      }
    ];
  }

  private getMockChatStats(): ChatStats {
    return {
      totalConversations: 4,
      unreadMessages: 1,
      activeChats: 3,
      totalMessages: 20
    };
  }
}

export const chatService = new ChatService();
export default chatService;
