import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
// import { Progress } from '../../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Clock, Users, TrendingUp, BookOpen } from 'lucide-react';
import courseWatchTimeService, { CourseWatchTimeData, StudentCourseProgress } from '../../../utils/courseWatchTimeService';
import { useAuth } from '../../../context/AuthContext';

export const CourseWatchTime = () => {
  const [courseWatchTimeData, setCourseWatchTimeData] = useState<CourseWatchTimeData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [studentProgress, setStudentProgress] = useState<StudentCourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadCourseWatchTimeData = async () => {
      try {
        setLoading(true);
        const instructorId = user?.UserName || user?.email || 'abdulquader152@gmail.com';
        const data = await courseWatchTimeService.getCourseWatchTimeData(instructorId);
        setCourseWatchTimeData(data);
        console.log('Course watch time data loaded:', data);
      } catch (error) {
        console.error('Error loading course watch time data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourseWatchTimeData();
  }, [user]);

  useEffect(() => {
    const loadStudentProgress = async () => {
      if (selectedCourse === 'all') {
        setStudentProgress([]);
        return;
      }

      try {
        const instructorId = user?.UserName || user?.email || 'abdulquader152@gmail.com';
        const progress = await courseWatchTimeService.getStudentCourseProgress(instructorId, selectedCourse);
        setStudentProgress(progress);
        console.log('Student progress loaded for course:', selectedCourse, progress);
      } catch (error) {
        console.error('Error loading student progress:', error);
      }
    };

    loadStudentProgress();
  }, [selectedCourse, user]);

  const formatWatchTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} Min`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${remainingHours}h`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalWatchTime = courseWatchTimeData.reduce((sum, course) => sum + course.totalWatchTime, 0);
  const totalStudents = courseWatchTimeData.reduce((sum, course) => sum + course.totalStudents, 0);
  const averageWatchTime = totalStudents > 0 ? totalWatchTime / totalStudents : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <img src="/icons/loader.gif" alt="Loading..." className="w-16 h-16 mb-4" />
        <p className="text-gray-600">Loading course watch time data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatWatchTime(totalWatchTime)}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Watch Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatWatchTime(averageWatchTime)}</div>
            <p className="text-xs text-muted-foreground">Per student</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseWatchTimeData.length}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Course-wise Watch Time Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course-wise Watch Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Total Watch Time</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Avg. Watch Time</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Last Accessed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseWatchTimeData.map((course) => (
                <TableRow key={course.courseId}>
                  <TableCell className="font-medium">{course.courseTitle}</TableCell>
                  <TableCell>{formatWatchTime(course.totalWatchTime)}</TableCell>
                  <TableCell>{course.totalStudents}</TableCell>
                  <TableCell>{formatWatchTime(course.averageWatchTime)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${course.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(course.completionRate)}%
                          </span>
                        </div>
                      </TableCell>
                  <TableCell>
                    {course.lastAccessed.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setSelectedCourse(course.courseId)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Progress for Selected Course */}
      {selectedCourse !== 'all' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Student Progress - {courseWatchTimeData.find(c => c.courseId === selectedCourse)?.courseTitle}
              </CardTitle>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courseWatchTimeData.map((course) => (
                    <SelectItem key={course.courseId} value={course.courseId}>
                      {course.courseTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {studentProgress.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Watch Time</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Accessed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentProgress.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">{student.studentName}</TableCell>
                      <TableCell>{formatWatchTime(student.watchTime)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(student.progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.lastAccessed.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No student progress data available for the selected course.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
