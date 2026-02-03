import { db } from '../lib/firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'moderator' | 'admin';
  joinedAt: Date;
  profileImage?: string;
}

export interface GroupData {
  id: string;
  name: string;
  description: string;
  instructorId: string;
  courseId: string;
  status: 'active' | 'inactive' | 'archived';
  memberCount: number;
  courseCount: number;
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
  members: GroupMember[];
  courses: string[];
  tags: string[];
}

class GroupsService {
  private readonly GROUPS_COLLECTION = 'groups';
  private readonly GROUP_MEMBERS_COLLECTION = 'groupMembers';
  private readonly GROUP_COURSES_COLLECTION = 'groupCourses';

  // Get all groups for an instructor
  async getGroupsData(instructorId: string): Promise<GroupData[]> {
    try {
      const groupsQuery = query(
        collection(db, this.GROUPS_COLLECTION),
        where('instructorId', '==', instructorId),
        // orderBy('createdAt', 'desc')
      );
      const groupsSnapshot = await getDocs(groupsQuery);

      if (groupsSnapshot.empty) {
        return this.getMockGroupsData();
      }

      const groups: GroupData[] = [];
      for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data() as any;

        // Get members for this group
        const membersQuery = query(
          collection(db, this.GROUP_MEMBERS_COLLECTION),
          where('groupId', '==', groupDoc.id)
        );
        const membersSnapshot = await getDocs(membersQuery);

        const members: GroupMember[] = [];
        membersSnapshot.forEach(memberDoc => {
          const memberData = memberDoc.data() as any;
          members.push({
            id: memberDoc.id,
            name: memberData?.name || 'Unknown Member',
            email: memberData?.email || 'unknown@email.com',
            role: memberData?.role || 'student',
            joinedAt: memberData?.joinedAt?.toDate() || new Date(),
            profileImage: memberData?.profileImage
          });
        });

        // Get courses for this group
        const coursesQuery = query(
          collection(db, this.GROUP_COURSES_COLLECTION),
          where('groupId', '==', groupDoc.id)
        );
        const coursesSnapshot = await getDocs(coursesQuery);

        const courses: string[] = [];
        coursesSnapshot.forEach(courseDoc => {
          const courseData = courseDoc.data() as any;
          if (courseData?.courseId) {
            courses.push(courseData.courseId);
          }
        });

        groups.push({
          id: groupDoc.id,
          name: groupData?.name || 'Unknown Group',
          description: groupData?.description || '',
          instructorId: groupData?.instructorId || instructorId,
          courseId: groupData?.courseId || '',
          status: groupData?.status || 'active',
          memberCount: members.length,
          courseCount: courses.length,
          maxMembers: groupData?.maxMembers || 50,
          createdAt: groupData?.createdAt?.toDate() || new Date(),
          updatedAt: groupData?.updatedAt?.toDate() || new Date(),
          members: groupData?.members || members,
          courses,
          tags: groupData?.tags || []
        });
      }

      return groups;

    } catch (error) {
      console.error('Error getting groups data:', error);
      return this.getMockGroupsData();
    }
  }

  // Create a new group
  async createGroup(instructorId: string, groupData: Partial<GroupData>): Promise<GroupData> {
    try {
      const newGroup = {
        name: groupData.name || 'New Group',
        description: groupData.description || '',
        instructorId,
        courseId: groupData.courseId || '',
        members: groupData.members || [],
        status: groupData.status || 'active',
        maxMembers: groupData.maxMembers || 50,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: groupData.tags || []
      };

      const docRef = await addDoc(collection(db, this.GROUPS_COLLECTION), newGroup);

      // Create the group data object with the generated ID
      const createdGroup: GroupData = {
        id: docRef.id,
        name: newGroup.name,
        description: newGroup.description,
        instructorId,
        courseId: newGroup.courseId,
        status: newGroup.status,
        memberCount: newGroup.members.length,
        courseCount: 1,
        maxMembers: newGroup.maxMembers,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: newGroup.members || [],
        courses: [],
        tags: newGroup.tags
      };

      return createdGroup;

    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  }

  // Update an existing group
  async updateGroup(groupId: string, updates: Partial<GroupData>): Promise<void> {
    try {
      console.log('Service: Updating group', groupId, 'with updates:', updates);

      const groupRef = doc(db, this.GROUPS_COLLECTION, groupId);

      // Check if the group exists first
      const groupDoc = await getDocs(query(collection(db, this.GROUPS_COLLECTION), where('__name__', '==', groupId)));
      if (groupDoc.empty) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      console.log('Service: Update data:', updateData);

      await updateDoc(groupRef, updateData);
      console.log('Service: Group updated successfully');

    } catch (error) {
      console.error('Service: Error updating group:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update group: ${error.message}`);
      } else {
        throw new Error('Failed to update group: Unknown error');
      }
    }
  }

  // Delete a group
  async deleteGroup(groupId: string): Promise<void> {
    try {
      // Delete group members
      const membersQuery = query(
        collection(db, this.GROUP_MEMBERS_COLLECTION),
        where('groupId', '==', groupId)
      );
      const membersSnapshot = await getDocs(membersQuery);

      for (const memberDoc of membersSnapshot.docs) {
        await deleteDoc(doc(db, this.GROUP_MEMBERS_COLLECTION, memberDoc.id));
      }

      // Delete group courses
      const coursesQuery = query(
        collection(db, this.GROUP_COURSES_COLLECTION),
        where('groupId', '==', groupId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);

      for (const courseDoc of coursesSnapshot.docs) {
        await deleteDoc(doc(db, this.GROUP_COURSES_COLLECTION, courseDoc.id));
      }

      // Delete the group itself
      await deleteDoc(doc(db, this.GROUPS_COLLECTION, groupId));

    } catch (error) {
      console.error('Error deleting group:', error);
      throw new Error('Failed to delete group');
    }
  }

  // Add member to group
  async addMemberToGroup(groupId: string, memberData: Partial<GroupMember>): Promise<void> {
    try {
      const newMember = {
        groupId,
        name: memberData.name || 'Unknown Member',
        email: memberData.email || 'unknown@email.com',
        role: memberData.role || 'student',
        joinedAt: serverTimestamp(),
        profileImage: memberData.profileImage
      };

      await addDoc(collection(db, this.GROUP_MEMBERS_COLLECTION), newMember);

      // Update group member count
      const groupRef = doc(db, this.GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, {
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error adding member to group:', error);
      throw new Error('Failed to add member to group');
    }
  }

  // Remove member from group
  async removeMemberFromGroup(groupId: string, memberId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.GROUP_MEMBERS_COLLECTION, memberId));

      // Update group member count
      const groupRef = doc(db, this.GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, {
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error removing member from group:', error);
      throw new Error('Failed to remove member from group');
    }
  }

  // Add course to group
  async addCourseToGroup(groupId: string, courseId: string): Promise<void> {
    try {
      const newGroupCourse = {
        groupId,
        courseId,
        addedAt: serverTimestamp()
      };

      await addDoc(collection(db, this.GROUP_COURSES_COLLECTION), newGroupCourse);

      // Update group course count
      const groupRef = doc(db, this.GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, {
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error adding course to group:', error);
      throw new Error('Failed to add course to group');
    }
  }

  // Remove course from group
  async removeCourseFromGroup(groupId: string, courseId: string): Promise<void> {
    try {
      const coursesQuery = query(
        collection(db, this.GROUP_COURSES_COLLECTION),
        where('groupId', '==', groupId),
        where('courseId', '==', courseId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);

      for (const courseDoc of coursesSnapshot.docs) {
        await deleteDoc(doc(db, this.GROUP_COURSES_COLLECTION, courseDoc.id));
      }

      // Update group course count
      const groupRef = doc(db, this.GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, {
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error removing course from group:', error);
      throw new Error('Failed to remove course from group');
    }
  }

  // Mock data for fallback
  getMockGroupsData(): GroupData[] {
    return [
      {
        id: '1',
        name: 'Web Development Cohort 2025',
        description: 'Advanced web development group for experienced developers looking to master modern frameworks and tools.',
        instructorId: 'instructor-1',
        courseId: 'course-1',
        status: 'active',
        memberCount: 24,
        courseCount: 3,
        maxMembers: 30,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-08-20'),
        members: [
          {
            id: 'member-1',
            name: 'Mehul Shah',
            email: 'mehul.shah@email.com',
            role: 'student',
            joinedAt: new Date('2025-01-20')
          },
          {
            id: 'member-2',
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@email.com',
            role: 'moderator',
            joinedAt: new Date('2025-01-18')
          }
        ],
        courses: ['course-1', 'course-2', 'course-3'],
        tags: ['web-development', 'react', 'nodejs']
      },
      {
        id: '2',
        name: 'Data Science Beginners',
        description: 'Introduction to data science concepts, Python programming, and statistical analysis for beginners.',
        instructorId: 'instructor-1',
        courseId: 'course-4',
        status: 'active',
        memberCount: 18,
        courseCount: 2,
        maxMembers: 25,
        createdAt: new Date('2025-02-10'),
        updatedAt: new Date('2025-08-18'),
        members: [
          {
            id: 'member-3',
            name: 'Priya Singh',
            email: 'priya.singh@email.com',
            role: 'student',
            joinedAt: new Date('2025-02-15')
          }
        ],
        courses: ['course-4', 'course-5'],
        tags: ['data-science', 'python', 'statistics']
      },
      {
        id: '3',
        name: 'UI/UX Design Workshop',
        description: 'Hands-on workshop for learning user interface and user experience design principles.',
        instructorId: 'instructor-1',
        courseId: 'course-6',
        status: 'inactive',
        memberCount: 12,
        courseCount: 1,
        maxMembers: 20,
        createdAt: new Date('2025-03-05'),
        updatedAt: new Date('2025-07-30'),
        members: [
          {
            id: 'member-4',
            name: 'Amit Patel',
            email: 'amit.patel@email.com',
            role: 'student',
            joinedAt: new Date('2025-03-10')
          }
        ],
        courses: ['course-6'],
        tags: ['ui-ux', 'design', 'workshop']
      },
      {
        id: '4',
        name: 'Mobile App Development',
        description: 'Comprehensive mobile app development using React Native and Flutter frameworks.',
        instructorId: 'instructor-1',
        courseId: 'course-7',
        status: 'active',
        memberCount: 31,
        courseCount: 4,
        maxMembers: 40,
        createdAt: new Date('2025-04-01'),
        updatedAt: new Date('2025-08-22'),
        members: [
          {
            id: 'member-5',
            name: 'Neha Sharma',
            email: 'neha.sharma@email.com',
            role: 'student',
            joinedAt: new Date('2025-04-05')
          }
        ],
        courses: ['course-7', 'course-8', 'course-9', 'course-10'],
        tags: ['mobile-development', 'react-native', 'flutter']
      }
    ];
  }
}

export const groupsService = new GroupsService();
export default groupsService;
