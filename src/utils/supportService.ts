import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'course' | 'general' | 'feature-request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  instructorId: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  attachments?: string[];
  tags?: string[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'instructor' | 'support' | 'admin';
  message: string;
  timestamp: Date;
  isInternal: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  categoryBreakdown: {
    category: string;
    count: number;
    percentage: number;
  }[];
}

class SupportService {
  private readonly TICKETS_COLLECTION = 'supportTickets';
  private readonly MESSAGES_COLLECTION = 'supportMessages';
  private readonly FAQS_COLLECTION = 'supportFAQs';

  // Create a new support ticket
  async createTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket> {
    try {
      const ticketRef = await addDoc(collection(db, this.TICKETS_COLLECTION), {
        ...ticketData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create initial message
      await addDoc(collection(db, this.MESSAGES_COLLECTION), {
        ticketId: ticketRef.id,
        senderId: ticketData.instructorId,
        senderName: 'You',
        senderRole: 'instructor',
        message: ticketData.description,
        timestamp: serverTimestamp(),
        isInternal: false
      });

      return {
        ...ticketData,
        id: ticketRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw new Error('Failed to create support ticket');
    }
  }

  // Get all tickets for an instructor
  async getTickets(instructorId: string): Promise<SupportTicket[]> {
    try {
      const ticketsQuery = query(
        collection(db, this.TICKETS_COLLECTION),
        where('instructorId', '==', instructorId),
        orderBy('createdAt', 'desc')
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      
      if (ticketsSnapshot.empty) {
        return this.getMockTickets(instructorId);
      }

      const tickets: SupportTicket[] = [];
      ticketsSnapshot.forEach(doc => {
        const data = doc.data() as any;
        tickets.push({
          id: doc.id,
          title: data?.title,
          description: data?.description,
          category: data?.category,
          priority: data?.priority,
          status: data?.status,
          instructorId: data?.instructorId,
          assignedTo: data?.assignedTo,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date(),
          resolvedAt: data?.resolvedAt?.toDate(),
          attachments: data?.attachments || [],
          tags: data?.tags || []
        });
      });

      return tickets;
    } catch (error) {
      console.error('Error getting tickets:', error);
      return this.getMockTickets(instructorId);
    }
  }

  // Get messages for a specific ticket
  async getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
    try {
      const messagesQuery = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('ticketId', '==', ticketId),
        orderBy('timestamp', 'asc')
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const messages: SupportMessage[] = [];
      messagesSnapshot.forEach(doc => {
        const data = doc.data() as any;
        messages.push({
          id: doc.id,
          ticketId: data?.ticketId,
          senderId: data?.senderId,
          senderName: data?.senderName,
          senderRole: data?.senderRole,
          message: data?.message,
          timestamp: data?.timestamp?.toDate() || new Date(),
          isInternal: data?.isInternal || false
        });
      });

      return messages;
    } catch (error) {
      console.error('Error getting ticket messages:', error);
      return [];
    }
  }

  // Add a message to a ticket
  async addMessage(messageData: Omit<SupportMessage, 'id' | 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, this.MESSAGES_COLLECTION), {
        ...messageData,
        timestamp: serverTimestamp()
      });

      // Update ticket's updatedAt timestamp
      const ticketRef = doc(db, this.TICKETS_COLLECTION, messageData.ticketId);
      await updateDoc(ticketRef, {
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }
  }

  // Update ticket status
  async updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<void> {
    try {
      const ticketRef = doc(db, this.TICKETS_COLLECTION, ticketId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (status === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
      }

      await updateDoc(ticketRef, updateData);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw new Error('Failed to update ticket status');
    }
  }

  // Get unique categories for filtering
  async getTicketCategories(): Promise<string[]> {
    try {
      const tickets = await this.getTickets('demo'); // Use demo to get categories
      const categories = Array.from(new Set(tickets.map(ticket => ticket.category)));
      return categories;
    } catch (error) {
      console.error('Error getting ticket categories:', error);
      return ['technical', 'billing', 'course', 'general', 'feature-request'];
    }
  }

  // Get unique priorities for filtering
  async getTicketPriorities(): Promise<string[]> {
    try {
      const tickets = await this.getTickets('demo'); // Use demo to get priorities
      const priorities = Array.from(new Set(tickets.map(ticket => ticket.priority)));
      return priorities;
    } catch (error) {
      console.error('Error getting ticket priorities:', error);
      return ['low', 'medium', 'high', 'urgent'];
    }
  }

  // Get support statistics
  async getSupportStats(instructorId: string): Promise<SupportStats> {
    try {
      const tickets = await this.getTickets(instructorId);
      
      const totalTickets = tickets.length;
      const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
      const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
      
      // Calculate average resolution time
      const resolvedTicketsWithTime = tickets.filter(t => t.status === 'resolved' && t.resolvedAt);
      let totalResolutionTime = 0;
      resolvedTicketsWithTime.forEach(ticket => {
        if (ticket.resolvedAt) {
          totalResolutionTime += ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
        }
      });
      const averageResolutionTime = resolvedTicketsWithTime.length > 0 
        ? totalResolutionTime / resolvedTicketsWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Category breakdown
      const categoryMap = new Map<string, number>();
      tickets.forEach(ticket => {
        categoryMap.set(ticket.category, (categoryMap.get(ticket.category) || 0) + 1);
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
        percentage: (count / totalTickets) * 100
      }));

      return {
        totalTickets,
        openTickets,
        resolvedTickets,
        averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
        categoryBreakdown
      };
    } catch (error) {
      console.error('Error getting support stats:', error);
      return this.getMockSupportStats();
    }
  }

  // Get FAQs
  async getFAQs(): Promise<FAQ[]> {
    try {
      const faqsQuery = query(
        collection(db, this.FAQS_COLLECTION),
        orderBy('helpfulCount', 'desc')
      );
      const faqsSnapshot = await getDocs(faqsQuery);
      
      if (faqsSnapshot.empty) {
        return this.getMockFAQs();
      }

      const faqs: FAQ[] = [];
      faqsSnapshot.forEach(doc => {
        const data = doc.data() as any;
        faqs.push({
          id: doc.id,
          question: data?.question,
          answer: data?.answer,
          category: data?.category,
          tags: data?.tags || [],
          helpfulCount: data?.helpfulCount || 0,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date()
        });
      });

      return faqs;
    } catch (error) {
      console.error('Error getting FAQs:', error);
      return this.getMockFAQs();
    }
  }

  // Mock data methods
  private getMockTickets(instructorId: string): SupportTicket[] {
    return [
      {
        id: '1',
        title: 'Course upload issue',
        description: 'I\'m having trouble uploading video files larger than 500MB. The upload keeps failing.',
        category: 'technical',
        priority: 'high',
        status: 'open',
        instructorId,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15'),
        tags: ['upload', 'video', 'file-size']
      },
      {
        id: '2',
        title: 'Payment processing delay',
        description: 'My payout request from last week is still pending. When can I expect it to be processed?',
        category: 'billing',
        priority: 'medium',
        status: 'in-progress',
        instructorId,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-12'),
        tags: ['payout', 'payment', 'delay']
      },
      {
        id: '3',
        title: 'Student enrollment notification',
        description: 'I\'m not receiving email notifications when students enroll in my courses.',
        category: 'course',
        priority: 'low',
        status: 'resolved',
        instructorId,
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-08'),
        resolvedAt: new Date('2025-01-08'),
        tags: ['notifications', 'email', 'enrollment']
      },
      {
        id: '4',
        title: 'Feature request: Bulk student messaging',
        description: 'It would be great to have a feature to send messages to multiple students at once.',
        category: 'feature-request',
        priority: 'low',
        status: 'open',
        instructorId,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-20'),
        tags: ['messaging', 'bulk', 'feature']
      },
      {
        id: '5',
        title: 'Analytics dashboard not loading',
        description: 'The performance analytics page is taking too long to load and sometimes shows error messages.',
        category: 'technical',
        priority: 'medium',
        status: 'open',
        instructorId,
        createdAt: new Date('2025-01-24'),
        updatedAt: new Date('2025-01-24'),
        tags: ['analytics', 'performance', 'loading']
      },
      {
        id: '6',
        title: 'Course certificate customization',
        description: 'I want to customize the certificate template with my company logo and branding.',
        category: 'course',
        priority: 'low',
        status: 'open',
        instructorId,
        createdAt: new Date('2025-01-23'),
        updatedAt: new Date('2025-01-23'),
        tags: ['certificate', 'customization', 'branding']
      }
    ];
  }

  private getMockFAQs(): FAQ[] {
    return [
      {
        id: '1',
        question: 'How do I upload course content?',
        answer: 'To upload course content, go to your course dashboard, click on "Add Content", and use the file upload tool. Supported formats include MP4, PDF, and various image formats.',
        category: 'Course Management',
        tags: ['upload', 'content', 'course'],
        helpfulCount: 45,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      },
      {
        id: '2',
        question: 'What are the payment processing times?',
        answer: 'Standard payout processing takes 3-5 business days. Express payouts (for premium members) are processed within 24 hours.',
        category: 'Billing & Payments',
        tags: ['payment', 'payout', 'processing'],
        helpfulCount: 38,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      },
      {
        id: '3',
        question: 'How can I track student progress?',
        answer: 'Student progress is automatically tracked through our analytics dashboard. You can view detailed reports including completion rates, time spent, and assessment scores.',
        category: 'Analytics',
        tags: ['progress', 'tracking', 'analytics'],
        helpfulCount: 32,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      },
      {
        id: '4',
        question: 'What file formats are supported for videos?',
        answer: 'We support MP4, MOV, AVI, and WebM formats. For best quality and compatibility, we recommend using MP4 with H.264 encoding.',
        category: 'Technical',
        tags: ['video', 'formats', 'encoding'],
        helpfulCount: 28,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      },
      {
        id: '5',
        question: 'How do I create a course certificate?',
        answer: 'Course certificates are automatically generated when students complete 80% of the course content. You can customize the certificate template in your course settings.',
        category: 'Course Management',
        tags: ['certificate', 'completion', 'template'],
        helpfulCount: 25,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      }
    ];
  }

  private getMockSupportStats(): SupportStats {
    return {
      totalTickets: 4,
      openTickets: 2,
      resolvedTickets: 1,
      averageResolutionTime: 2.5,
      categoryBreakdown: [
        { category: 'technical', count: 1, percentage: 25 },
        { category: 'billing', count: 1, percentage: 25 },
        { category: 'course', count: 1, percentage: 25 },
        { category: 'feature-request', count: 1, percentage: 25 }
      ]
    };
  }
}

export const supportService = new SupportService();
export default supportService;
