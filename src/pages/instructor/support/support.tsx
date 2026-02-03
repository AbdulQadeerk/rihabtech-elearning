import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  FileText,
  Tag,
  Calendar,
  User,
  Send,
  RefreshCw,
  BarChart3,
  BookOpen,
  CreditCard,
  Settings,
  Lightbulb
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useAuth } from '../../../context/AuthContext';
import { supportService, SupportTicket, SupportMessage, FAQ, SupportStats } from '../../../utils/supportService';
import { toast } from 'sonner';

export const Support = () => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'faq' | 'stats'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availablePriorities, setAvailablePriorities] = useState<string[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority'],
    status: 'open' as SupportTicket['status'],
    tags: [] as string[]
  });

  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user?.UserName) return;
      
      try {
        setLoading(true);
        const [ticketsData, faqsData, statsData, categoriesData, prioritiesData] = await Promise.all([
          supportService.getTickets(user.UserName),
          supportService.getFAQs(),
          supportService.getSupportStats(user.UserName),
          supportService.getTicketCategories(),
          supportService.getTicketPriorities()
        ]);
        
        setTickets(ticketsData);
        setFilteredTickets(ticketsData);
        setFaqs(faqsData);
        setStats(statsData);
        setAvailableCategories(categoriesData);
        setAvailablePriorities(prioritiesData);
      } catch (error) {
        console.error('Error loading support data:', error);
        toast.error('Failed to load support data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.UserName]);

  useEffect(() => {
    // Filter tickets based on search and filters
    let filtered = tickets;
    
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.tags && ticket.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    
    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  const handleCreateTicket = async () => {
    if (!user?.UserName || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const newTicket = await supportService.createTicket({
        ...formData,
        instructorId: user.UserName,
        status: 'open'
      });
      
      setTickets(prev => [newTicket, ...prev]);
      setShowCreateModal(false);
      setFormData({ title: '', description: '', category: 'technical', priority: 'medium', status: 'open', tags: [] });
      toast.success('Support ticket created successfully!');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
    
    try {
      const messages = await supportService.getTicketMessages(ticket.id);
      setTicketMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load ticket messages');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      setIsSending(true);
      await supportService.addMessage({
        ticketId: selectedTicket.id,
        senderId: user?.UserName || '',
        senderName: 'You',
        senderRole: 'instructor',
        message: newMessage.trim(),
        isInternal: false
      });
      
      // Add message to local state
      const message: SupportMessage = {
        id: Date.now().toString(),
        ticketId: selectedTicket.id,
        senderId: user?.UserName || '',
        senderName: 'You',
        senderRole: 'instructor',
        message: newMessage.trim(),
        timestamp: new Date(),
        isInternal: false
      };
      
      setTicketMessages(prev => [...prev, message]);
      setNewMessage('');
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      // Check if this is a mock ticket (has numeric ID)
      const isMockTicket = !isNaN(Number(ticketId));
      
      if (!isMockTicket) {
        // Update in Firebase
        await supportService.updateTicketStatus(ticketId, newStatus);
      }
      
      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus, updatedAt: new Date() }
          : ticket
      ));
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
      }
      
      toast.success('Ticket status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Settings className="w-4 h-4" />;
      case 'billing': return <CreditCard className="w-4 h-4" />;
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'feature-request': return <Lightbulb className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="form-title mr-2">Support Center</h1>
          <p className="text-gray-600">Get help and manage support tickets</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.totalTickets}</p>
                <p className="text-sm text-gray-600">Total Tickets</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.openTickets}</p>
                <p className="text-sm text-gray-600">Open Tickets</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.resolvedTickets}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.averageResolutionTime}</p>
                <p className="text-sm text-gray-600">Avg. Resolution (days)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Support Tickets ({tickets.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'faq'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ ({faqs.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search tickets by title, description, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {availablePriorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Clear Filters Button */}
                {(statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || searchTerm) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setPriorityFilter('all');
                      setSearchTerm('');
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Ticket Count and List */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredTickets.length} of {tickets.length} tickets
                </p>
              </div>
              
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' 
                      ? 'No tickets found' 
                      : 'No support tickets yet'
                    }
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all'
                      ? 'Try adjusting your search or filters to find what you\'re looking for'
                      : 'Create your first support ticket to get help from our team'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && priorityFilter === 'all' && (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Ticket
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace('-', ' ').charAt(0).toUpperCase() + ticket.status.replace('-', ' ').slice(1)}
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(ticket.category)}
                              <span className="capitalize">{ticket.category.replace('-', ' ')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {ticket.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <MessageCircle size={16} className="mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
                <p className="text-gray-600">Find answers to common questions about using our platform.</p>
              </div>
              
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{faq.question}</h4>
                      <Badge variant="outline" className="text-xs">
                        {faq.category}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{faq.answer}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {faq.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Helpful: {faq.helpfulCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Support Analytics</h3>
                <p className="text-gray-600">Detailed breakdown of your support ticket statistics.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-4">Tickets by Category</h4>
                  <div className="space-y-3">
                    {stats.categoryBreakdown.map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {category.category.replace('-', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {category.count} ({Math.round(category.percentage)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Resolution Time */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-4">Resolution Performance</h4>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{stats.averageResolutionTime}</p>
                      <p className="text-sm text-gray-600">Average Days to Resolve</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{stats.openTickets}</p>
                        <p className="text-sm text-gray-600">Open Tickets</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
                        <p className="text-sm text-gray-600">Resolved</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Create Support Ticket</h2>
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of your issue or question"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: SupportTicket['category']) => 
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="feature-request">Feature Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value: SupportTicket['priority']) => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: SupportTicket['status']) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <Input
                  value={formData.tags.join(', ')}
                  placeholder="upload, video, payment"
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                    setFormData(prev => ({ ...prev, tags }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add relevant tags to help categorize your ticket
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateTicket}
                  disabled={isCreating || !formData.title || !formData.description}
                  className="flex-1"
                >
                  {isCreating ? 'Creating...' : 'Create Ticket'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedTicket.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status.replace('-', ' ').charAt(0).toUpperCase() + selectedTicket.status.replace('-', ' ').slice(1)}
                  </Badge>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedTicket.category.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowTicketModal(false)}>
                ✕
              </Button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">{selectedTicket.description}</p>
            </div>
            
            {/* Status Update */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
              <div className="flex gap-2">
                {(['open', 'in-progress', 'resolved', 'closed'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={selectedTicket.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedTicket.id, status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Messages */}
            <div className="mb-4">
              <h4 className="font-medium mb-3">Conversation</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {ticketMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.senderRole === 'instructor'
                        ? 'bg-blue-50 ml-8'
                        : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.senderName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Reply */}
            <div className="flex gap-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !newMessage.trim()}
              >
                {isSending ? 'Sending...' : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
