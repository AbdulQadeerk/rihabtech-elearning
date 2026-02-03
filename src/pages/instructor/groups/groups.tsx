import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, BookOpen, Search, Filter, MoreVertical, Edit, Trash2, Eye, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useAuth } from '../../../context/AuthContext';
import { groupsService, GroupData, GroupMember } from '../../../utils/groupsService';
import { toast } from 'sonner';
import { getInstructorCourses } from '../../../utils/firebaseInstructorCourses';
import { CourseDisplayData } from '../course/courseList';
import { StudentData } from '../../../utils/dashboardService';
import { getAllUsers } from '../../../utils/firebaseUsers';

export const Groups = () => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<GroupData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const loadGroups = async () => {
      if (!user?.UserName) return;
      
      try {
        setLoading(true);
        const groupsData = await groupsService.getGroupsData(user.UserName);
        setGroups(groupsData);
        setFilteredGroups(groupsData);
        console.log('Loaded groups:', groupsData);
      } catch (error) {
        console.error('Error loading groups:', error);
        // Fallback to mock data
        const mockGroups = groupsService.getMockGroupsData();
        setGroups(mockGroups);
        setFilteredGroups(mockGroups);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [user?.UserName]);

  useEffect(() => {
    // Filter groups based on search term and status
    let filtered = groups;
    
    if (searchTerm) {
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => group.status === statusFilter);
    }
    
    setFilteredGroups(filtered);
  }, [groups, searchTerm, statusFilter]);

  const handleCreateGroup = async (groupData: Partial<GroupData>) => {
    if (!user?.UserName) return;
    
    try {
      setIsCreating(true);
      
      // Try to create in Firebase first
      try {
        const newGroup = await groupsService.createGroup(user.UserName, groupData);
        setGroups(prev => [newGroup, ...prev]);
        setShowCreateModal(false);
        toast.success('Group created successfully!');
      } catch (firebaseError) {
        console.warn('Firebase creation failed, creating mock group:', firebaseError);
        
        // Fallback to creating a mock group
        const mockGroup: GroupData = {
          id: Date.now().toString(), // Use timestamp as ID
          name: groupData.name || 'New Group',
          description: groupData.description || '',
          instructorId: user.UserName,
          courseId: groupData.courseId || '',
          status: groupData.status || 'active',
          memberCount: 0,
          courseCount: 0,
          maxMembers: groupData.maxMembers || 50,
          createdAt: new Date(),
          updatedAt: new Date(),
          members: groupData.members || [],
          courses: [],
          tags: groupData.tags || []
        };
        
        setGroups(prev => [mockGroup, ...prev]);
        setShowCreateModal(false);
        toast.success('Group created successfully! (Mock data)');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      setIsDeleting(true);
      
      // Check if this is a mock group
      const isMockGroup = /^\d+$/.test(groupId);
      
      if (isMockGroup) {
        // For mock groups, just update the local state
        setGroups(prev => prev.filter(group => group.id !== groupId));
        setShowDeleteConfirm(false);
        setDeletingGroup(null);
        toast.success('Group deleted successfully! (Mock data)');
        return;
      }
      
      // For real Firebase groups, delete from Firebase
      await groupsService.deleteGroup(groupId);
      setGroups(prev => prev.filter(group => group.id !== groupId));
      setShowDeleteConfirm(false);
      setDeletingGroup(null);
      toast.success('Group deleted successfully!');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteGroup = (group: GroupData) => {
    setDeletingGroup(group);
    setShowDeleteConfirm(true);
  };

  const handleEditGroup = (group: GroupData) => {
    setEditingGroup(group);
    setShowEditModal(true);
  };



  const handleUpdateGroup = async (groupData: Partial<GroupData>) => {
    if (!editingGroup?.id) return;
    
    try {
      setIsUpdating(true);
      console.log('Updating group:', editingGroup.id, 'with data:', groupData);
      
      // Check if this is a mock group (has simple ID like '1', '2', etc.)
      const isMockGroup = /^\d+$/.test(editingGroup.id);
      
      if (isMockGroup) {
        // For mock groups, just update the local state
        setGroups(prev => prev.map(group => 
          group.id === editingGroup.id 
            ? { ...group, ...groupData, updatedAt: new Date() }
            : group
        ));
        setShowEditModal(false);
        setEditingGroup(null);
        toast.success('Group updated successfully! (Mock data)');
        return;
      }
      
      // For real Firebase groups, update in Firebase
      await groupsService.updateGroup(editingGroup.id, groupData);
      
      setGroups(prev => prev.map(group => 
        group.id === editingGroup.id 
          ? { ...group, ...groupData, updatedAt: new Date() }
          : group
      ));
      setShowEditModal(false);
      setEditingGroup(null);
      toast.success('Group updated successfully!');
    } catch (error) {
      console.error('Error updating group:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        groupId: editingGroup.id,
        groupData
      });
      toast.error(`Failed to update group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchiveGroup = async (groupId: string) => {
    try {
      // Check if this is a mock group
      const isMockGroup = /^\d+$/.test(groupId);
      
      if (isMockGroup) {
        // For mock groups, just update the local state
        setGroups(prev => prev.map(group => 
          group.id === groupId 
            ? { ...group, status: 'archived', updatedAt: new Date() }
            : group
        ));
        toast.success('Group archived successfully! (Mock data)');
        return;
      }
      
      // For real Firebase groups, update in Firebase
      await groupsService.updateGroup(groupId, { status: 'archived' });
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, status: 'archived', updatedAt: new Date() }
          : group
      ));
      toast.success('Group archived successfully!');
    } catch (error) {
      console.error('Error archiving group:', error);
      toast.error('Failed to archive group. Please try again.');
    }
  };

  const handleRestoreGroup = async (groupId: string) => {
    try {
      // Check if this is a mock group
      const isMockGroup = /^\d+$/.test(groupId);
      
      if (isMockGroup) {
        // For mock groups, just update the local state
        setGroups(prev => prev.map(group => 
          group.id === groupId 
            ? { ...group, status: 'active', updatedAt: new Date() }
            : group
        ));
        toast.success('Group restored successfully! (Mock data)');
        return;
      }
      
      // For real Firebase groups, update in Firebase
      await groupsService.updateGroup(groupId, { status: 'active' });
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, status: 'active', updatedAt: new Date() }
          : group
      ));
      toast.success('Group restored successfully!');
    } catch (error) {
      console.error('Error restoring group:', error);
      toast.error('Failed to restore group. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
           <h1 className="form-title mr-2">Groups</h1>
           <p className="text-gray-600">Manage your student groups and cohorts</p>
           {groups.length > 0 && groups.some(g => /^\d+$/.test(g.id)) && (
             <div className="flex items-center gap-2 mt-2">
               <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
               <span className="text-sm text-yellow-700">Using demo data - changes will be saved locally</span>
             </div>
           )}
         </div>
         <div className="flex gap-3">
           <Button 
             variant="outline"
             onClick={() => window.location.reload()}
             className="flex items-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
             Refresh
           </Button>
           <Button 
             onClick={() => setShowCreateModal(true)}
             className="bg-primary hover:bg-primary/90"
           >
             <Plus size={16} className="mr-2" />
             Create Group
           </Button>
         </div>
       </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">{groups.length}</p>
              <p className="text-sm text-gray-600">Total Groups</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">
                {groups.reduce((sum, group) => sum + group.memberCount, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">
                {groups.reduce((sum, group) => sum + group.courseCount, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Courses</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">
                {groups.filter(group => group.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active Groups</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Groups List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Groups ({filteredGroups.length})</h2>
        </div>
        
                 {filteredGroups.length === 0 ? (
           <div className="p-12 text-center">
             <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-gray-900 mb-2">
               {searchTerm || statusFilter !== 'all' ? 'No groups found' : 'No groups yet'}
             </h3>
             <p className="text-gray-500 mb-4">
               {searchTerm || statusFilter !== 'all' 
                 ? 'Try adjusting your search or filters to find what you\'re looking for'
                 : 'Create your first group to start organizing students and courses'
               }
             </p>
             {!searchTerm && statusFilter === 'all' && (
               <div className="space-y-3">
                 <Button onClick={() => setShowCreateModal(true)}>
                   <Plus size={16} className="mr-2" />
                   Create Your First Group
                 </Button>
                 <p className="text-xs text-gray-400">
                   Groups help you organize students, create learning cohorts, and manage course assignments
                 </p>
               </div>
             )}
           </div>
         ) : (
          <div className="divide-y">
            {filteredGroups.map((group) => (
              <div key={group.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      <Badge className={getStatusColor(group.status)}>
                        {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="font-bold mb-3">Course: {group.courseId}</p>
                    
                                         <p className="text-gray-600 mb-3">{group.description}</p>
                     
                     {/* Tags */}
                     {group.tags && group.tags.length > 0 && (
                       <div className="flex flex-wrap gap-2 mb-3">
                         {group.tags.slice(0, 3).map((tag, index) => (
                           <span
                             key={index}
                             className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                           >
                             {tag}
                           </span>
                         ))}
                         {group.tags.length > 3 && (
                           <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                             +{group.tags.length - 3} more
                           </span>
                         )}
                       </div>
                     )}
                     
                     <div className="flex items-center gap-6 text-sm text-gray-500">
                       <div className="flex items-center gap-1">
                         <Users className="w-4 h-4" />
                         <span>{group.memberCount} / {group.maxMembers} members</span>
                         <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-primary rounded-full transition-all duration-300"
                             style={{ width: `${Math.min((group.memberCount / group.maxMembers) * 100, 100)}%` }}
                           />
                         </div>
                       </div>
                       <div className="flex items-center gap-1">
                         <BookOpen className="w-4 h-4" />
                         <span>{group.courseCount} courses</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <Calendar className="w-4 h-4" />
                         <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGroup(group)}
                    >
                      <Eye size={16} className="mr-2" />
                      View
                    </Button>
                                         <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleEditGroup(group)}
                     >
                       <Edit size={16} className="mr-2" />
                       Edit
                     </Button>
                                         {group.status !== 'archived' ? (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleArchiveGroup(group.id)}
                         className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                       >
                         <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0h14" />
                         </svg>
                         Archive
                       </Button>
                     ) : (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleRestoreGroup(group.id)}
                         className="text-green-600 hover:text-green-700 hover:bg-green-50"
                       >
                         <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                         </svg>
                         Restore
                       </Button>
                     )}
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => confirmDeleteGroup(group)}
                       className="text-red-600 hover:text-red-700 hover:bg-red-50"
                     >
                       <Trash2 size={16} className="mr-2" />
                       Delete
                     </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

             {/* Create Group Modal */}
       {showCreateModal && (
         <CreateGroupModal
           onClose={() => setShowCreateModal(false)}
           onSubmit={handleCreateGroup}
           isCreating={isCreating}
         />
       )}

             {/* View Group Modal */}
       {selectedGroup && (
         <ViewGroupModal
           group={selectedGroup}
           onClose={() => setSelectedGroup(null)}
         />
       )}

       {/* Edit Group Modal */}
       {showEditModal && editingGroup && (
         <EditGroupModal
           group={editingGroup}
           onClose={() => {
             setShowEditModal(false);
             setEditingGroup(null);
           }}
           onSubmit={handleUpdateGroup}
           isUpdating={isUpdating}
         />
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteConfirm && deletingGroup && (
         <DeleteConfirmModal
           group={deletingGroup}
           onClose={() => {
             setShowDeleteConfirm(false);
             setDeletingGroup(null);
           }}
           onConfirm={() => handleDeleteGroup(deletingGroup.id)}
           isDeleting={isDeleting}
         />
       )}
     </div>
   );
 };

 // Create Group Modal Component
 interface CreateGroupModalProps {
   onClose: () => void;
   onSubmit: (groupData: Partial<GroupData>) => void;
   isCreating: boolean;
 }

 const CreateGroupModal = ({ onClose, onSubmit, isCreating }: CreateGroupModalProps) => {
  const [courses, setCourses] = useState<CourseDisplayData[]>([]);
  const [members, setmembers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [filteredmembers, setFilteredmembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
     const [formData, setFormData] = useState({
     name: '',
     description: '',
     courseId: '',
     members: [] as GroupMember[],
     status: 'active' as 'active' | 'inactive' | 'archived',
     maxMembers: 50,
     tags: [] as string[]
   });

     useEffect(() => {
       const loadStudentsData = async () => {
         if (!user?.UserName) return;
         
         try {
           //setLoading(true);
           
           const tempmembers = await getAllUsers();
               
               setmembers(tempmembers as User[]);
               console.log("searchTerm", searchTerm);
               const filteredOptions = tempmembers;
  setFilteredmembers(filteredOptions as  User[]);
  console.log("filteredOptions:", filteredOptions);
         } catch (error) {
           console.error('Error loading data:', error);
           // Fallback to mock data
           
         } finally {
           //setLoading(false);
         }
       };
   
       loadStudentsData();
     }, [user?.UserName]);


      useEffect(() => {
   const fetchInstructorCourses = async () => {
           try {
               //setLoading(true);
               
               if (!user?.UserName) {
                   console.log("No user email found");
                   return;
               }
   
               const instructorCourses = await getInstructorCourses(user.UserName);
               
               // Transform Firebase data to match the UI structure
               const transformedCourses: CourseDisplayData[] = instructorCourses.map(course => ({
                   ...course,
                   // Add mock data for fields not in Firebase (for now)
                   earnings: Math.floor(Math.random() * 5000) + 500, // Random earnings between 500-5500
                   enrollments: Math.floor(Math.random() * 100) + 20, // Random enrollments between 20-120
                   ratings: Math.floor(Math.random() * 200) + 500, // Random ratings between 500-700
                   ratingScore: parseFloat((Math.random() * 2 + 3).toFixed(1)) // Random rating between 3.0-5.0
               }));
               
               console.log("Transformed courses:", transformedCourses);
               setCourses(transformedCourses);
   
           } catch (err) {
               console.error("Error fetching courses:", err);
               
           } finally {
               //setLoading(false);
           }
       };
        fetchInstructorCourses();
       }, [user?.UserName]);
       

    const handleSelect = (member: User) => {
    setFormData((prev) => {
      const alreadySelected = prev.members.some((m) => m.id === member.id);
      return {
        ...prev,
        members: alreadySelected
          ? prev.members.filter((m) => m.id !== member.id) // remove if already selected
          : [
              ...prev.members,
              {
                id: member.id,
                name: `${member.firstName} ${member.lastName}`,
                email: member.email,
                role: member.role,
                joinedAt: new Date(),
              } as GroupMember,
            ], // add new as GroupMember
      };
    });
  };

  const handleRemove = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
  };

     const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     console.log('Form data before validation:', formData);
     if (!formData.name.trim() || !formData.description.trim() || !formData.courseId || formData.members.length<=0) {
       toast.error('Please fill in all required fields');
       return;
     }
     console.log('Submitting form data:', formData);
     onSubmit(formData);
   };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter group name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter group description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              required
            />
          </div>

          <Select value={formData.courseId} onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          <div className="w-full">
      <Select open={open} onOpenChange={setOpen}>
        <SelectTrigger className="w-full">Select members</SelectTrigger>
        <SelectContent>
          {/* Search Input */}
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                const search = value.toLowerCase();
                const filteredOptions = members.filter(
                  (option) =>
                    option.firstName?.toLowerCase().includes(search) ||
                    option.lastName?.toLowerCase().includes(search) ||
                    option.email?.toLowerCase().includes(search)
                );
                setFilteredmembers(filteredOptions);
              }}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Filtered Options */}
          {filteredmembers.length > 0 ? (
            filteredmembers.map((option) => {
              const isSelected = formData.members.some((m) => m.id === option.id);
              return (
                <div
                  key={option.id}
                  className={`cursor-pointer p-2 rounded flex justify-between items-center ${
                    isSelected ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                  onClick={() => {handleSelect(option);
                    setOpen(false);
                  }}
                >
                  <span>
                    {option.firstName} {option.lastName} ({option.email})
                  </span>
                  {isSelected && <span className="text-blue-600 font-bold">✔</span>}
                </div>
              );
            })
          ) : (
            <div className="p-2 text-gray-500">No results found</div>
          )}
        </SelectContent>
      </Select>

      {/* Show Selected Members */}
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Selected Members:</h4>
        <div className="flex flex-wrap gap-2">
          {formData.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
            >
              <span>
                {m.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                className="ml-1 text-blue-600 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'archived' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
                     <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Max Members
             </label>
             <Input
               type="number"
               value={formData.maxMembers}
               onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
               min="1"
               max="1000"
             />
           </div>
           
                       <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <Input
                placeholder="web-development, react, nodejs"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                  setFormData(prev => ({ ...prev, tags }));
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Add tags to help organize and categorize your groups
              </p>
            </div>
          
                     <div className="flex gap-3 pt-4">
             <Button type="submit" className="flex-1" disabled={isCreating}>
               {isCreating ? 'Creating...' : 'Create Group'}
             </Button>
             <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isCreating}>
               Cancel
             </Button>
           </div>
        </form>
      </div>
    </div>
     );
 };
 
 // Edit Group Modal Component
 interface EditGroupModalProps {
   group: GroupData;
   onClose: () => void;
   onSubmit: (groupData: Partial<GroupData>) => void;
   isUpdating: boolean;
 }
 
 const EditGroupModal = ({ group, onClose, onSubmit, isUpdating }: EditGroupModalProps) => {
  const [open, setOpen] = useState(false);
   const [courses, setCourses] = useState<CourseDisplayData[]>([]);
  const [members, setmembers] = useState<User[]>([]);
  const [filteredmembers, setFilteredmembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
     const [formData, setFormData] = useState({
     name: group.name,
     description: group.description,
     courseId: group.courseId || '',
     members: group.members as GroupMember[],
     status: group.status as 'active' | 'inactive' | 'archived',
     maxMembers: group.maxMembers || 50,
     tags: group.tags as string[]
   });

     useEffect(() => {
       const loadStudentsData = async () => {
         if (!user?.UserName) return;
         
         try {
           //setLoading(true);
           
           const tempmembers = await getAllUsers();
               
               setmembers(tempmembers as User[]);
               console.log("searchTerm", searchTerm);
               const filteredOptions = tempmembers;
  setFilteredmembers(filteredOptions as  User[]);
  console.log("filteredOptions:", filteredOptions);
         } catch (error) {
           console.error('Error loading data:', error);
           // Fallback to mock data
           
         } finally {
           //setLoading(false);
         }
       };
   
       loadStudentsData();
     }, [user?.UserName]);


      useEffect(() => {
   const fetchInstructorCourses = async () => {
           try {
               //setLoading(true);
               
               if (!user?.UserName) {
                   console.log("No user email found");
                   return;
               }
   
               const instructorCourses = await getInstructorCourses(user.UserName);
               
               // Transform Firebase data to match the UI structure
               const transformedCourses: CourseDisplayData[] = instructorCourses.map(course => ({
                   ...course,
                   // Add mock data for fields not in Firebase (for now)
                   earnings: Math.floor(Math.random() * 5000) + 500, // Random earnings between 500-5500
                   enrollments: Math.floor(Math.random() * 100) + 20, // Random enrollments between 20-120
                   ratings: Math.floor(Math.random() * 200) + 500, // Random ratings between 500-700
                   ratingScore: parseFloat((Math.random() * 2 + 3).toFixed(1)) // Random rating between 3.0-5.0
               }));
               
               console.log("Transformed courses:", transformedCourses);
               setCourses(transformedCourses);
   
           } catch (err) {
               console.error("Error fetching courses:", err);
               
           } finally {
               //setLoading(false);
           }
       };
        fetchInstructorCourses();
       }, [user?.UserName]);
       

    const handleSelect = (member: User) => {
    setFormData((prev) => {
      const alreadySelected = prev.members.some((m) => m.id === member.id);
      return {
        ...prev,
        members: alreadySelected
          ? prev.members.filter((m) => m.id !== member.id) // remove if already selected
          : [
              ...prev.members,
              {
                id: member.id,
                name: `${member.firstName} ${member.lastName}`,
                email: member.email,
                role: member.role,
                joinedAt: new Date(),
              } as GroupMember,
            ], // add new as GroupMember
      };
    });
  };

  const handleRemove = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
  };

     const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.name.trim() || !formData.description.trim() || !formData.courseId || formData.members.length<=0) {
       toast.error('Please fill in all required fields');
       return;
     }
     console.log('Submitting form data:', formData);
     onSubmit(formData);
   };
 
   return (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Edit Group</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter group name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter group description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              required
            />
          </div>

          <Select value={formData.courseId} onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          <div className="w-full">
      <Select open={open} onOpenChange={setOpen}>
        <SelectTrigger className="w-full">Select members</SelectTrigger>
        <SelectContent>
          {/* Search Input */}
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                const search = value.toLowerCase();
                const filteredOptions = members.filter(
                  (option) =>
                    option.firstName?.toLowerCase().includes(search) ||
                    option.lastName?.toLowerCase().includes(search) ||
                    option.email?.toLowerCase().includes(search)
                );
                setFilteredmembers(filteredOptions);
              }}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Filtered Options */}
          {filteredmembers.length > 0 ? (
            filteredmembers.map((option) => {
              const isSelected = formData.members.some((m) => m.id === option.id);
              return (
                <div
                  key={option.id}
                  className={`cursor-pointer p-2 rounded flex justify-between items-center ${
                    isSelected ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                  onClick={() => {handleSelect(option)
                    setOpen(false);
                  }}
                >
                  <span>
                    {option.firstName} {option.lastName} ({option.email})
                  </span>
                  {isSelected && <span className="text-blue-600 font-bold">✔</span>}
                </div>
              );
            })
          ) : (
            <div className="p-2 text-gray-500">No results found</div>
          )}
        </SelectContent>
      </Select>

      {/* Show Selected Members */}
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Selected Members:</h4>
        <div className="flex flex-wrap gap-2">
          {formData.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
            >
              <span>
                {m.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                className="ml-1 text-blue-600 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'archived' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
                     <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Max Members
             </label>
             <Input
               type="number"
               value={formData.maxMembers}
               onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
               min="1"
               max="1000"
             />
           </div>
           
                       <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <Input
                placeholder="web-development, react, nodejs"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                  setFormData(prev => ({ ...prev, tags }));
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Add tags to help organize and categorize your groups
              </p>
            </div>
          
                     <div className="flex gap-3 pt-4">
             <Button type="submit" className="flex-1" disabled={isUpdating}>
               {isUpdating ? 'Updating...' : 'Update Group'}
             </Button>
             <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isUpdating}>
               Cancel
             </Button>
           </div>
        </form>
      </div>
    </div>
   );
 };
 
 // Delete Confirmation Modal Component
 interface DeleteConfirmModalProps {
   group: GroupData;
   onClose: () => void;
   onConfirm: () => void;
   isDeleting: boolean;
 }
 
 const DeleteConfirmModal = ({ group, onClose, onConfirm, isDeleting }: DeleteConfirmModalProps) => {
   return (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
       <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
         <div className="text-center">
           <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
             <Trash2 className="h-6 w-6 text-red-600" />
           </div>
           
           <h3 className="text-lg font-medium text-gray-900 mb-2">
             Delete Group
           </h3>
           
           <p className="text-sm text-gray-500 mb-6">
             Are you sure you want to delete <strong>"{group.name}"</strong>? 
             This action cannot be undone and will remove all group members and course associations.
           </p>
           
           <div className="flex gap-3">
             <Button
               variant="outline"
               onClick={onClose}
               className="flex-1"
             >
               Cancel
             </Button>
             <Button
               onClick={onConfirm}
               className="flex-1 bg-red-600 hover:bg-red-700"
               disabled={isDeleting}
             >
               {isDeleting ? 'Deleting...' : 'Delete Group'}
             </Button>
           </div>
         </div>
       </div>
     </div>
   );
 };
 
 // View Group Modal Component
interface ViewGroupModalProps {
  group: GroupData;
  onClose: () => void;
}

const ViewGroupModal = ({ group, onClose }: ViewGroupModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">{group.name}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-gray-900">{group.description}</p>
          </div>

          {/* Status + Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Badge className="bg-green-100 text-green-800">{group.status}</Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Count</label>
              <p className="text-gray-900">
                {group.members?.length} / {group.maxMembers}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <p className="text-gray-900">
                {group.courseId || "—"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-gray-900">
                {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
              {group.members?.length > 0 ? (
                group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      {/* <img
                        src={member.profilePicture || "https://via.placeholder.com/40"}
                        alt={member.name}
                        className="w-8 h-8 rounded-full"
                      /> */}
                      <div>
                        <p className="font-medium">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{member.role || "member"}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No members added</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface User {
  id: string;
  address: string;
  bio: string;
  categoryId: string;
  email: string;
  firstName: string;
  isVerified: boolean;
  joinDate: Date;        // stored as Firestore timestamp, convert to Date in code
  lastLogin: Date;       // same as above
  lastName: string;
  phone: string;
  profilePicture: string;
  rating: number;
  role: string;          // e.g., "learner", "instructor"
  status: string;        // e.g., "active", "inactive"
  subCategoryId: string;
  totalCourses: number;
  totalStudents: number;
  userName: string;
}

export default Groups;
