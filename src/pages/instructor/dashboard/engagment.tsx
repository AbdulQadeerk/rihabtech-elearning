import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import courseEngagementService, {
  CourseEngagementReport,
  EngagementCourseOption,
  EngagementPeriod,
} from "../../../utils/courseEngagementService";

const PERIODS: { value: EngagementPeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "12m+", label: "Last 12+ months" },
];

export const Engagment = () => {
  const [report, setReport] = useState<CourseEngagementReport | null>(null);
  const [courses, setCourses] = useState<EngagementCourseOption[]>([]);
  const [period, setPeriod] = useState<EngagementPeriod>("12m");
  const [courseId, setCourseId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      const options = await courseEngagementService.getCourses();
      setCourses(options);
    } catch (err) {
      console.error("Failed to load engagement courses", err);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const selectedCourseId = courseId === "all" ? null : Number(courseId);
      const data = await courseEngagementService.getReport(period, selectedCourseId);
      setReport(data);
    } catch (err: any) {
      console.error("Failed to load engagement report", err);
      setError(err?.message || "Failed to load engagement report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadReport();
  }, [period, courseId]);

  const chartData = (report?.series || []).map((point) => ({
    label: point.label,
    minutes: Math.round(point.minutesTaught),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
        <h1 className="form-title mr-2">Course engagement</h1>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="rounded-none text-primary border border-primary w-full md:w-[240px]">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.courseId} value={String(c.courseId)}>
                {c.courseTitle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => setPeriod(v as EngagementPeriod)}>
          <SelectTrigger className="rounded-none text-primary border border-primary w-full md:w-[180px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={loadReport}
          disabled={loading}
          variant="outline"
          className="rounded-none border-primary text-primary hover:bg-primary hover:text-white md:ml-auto"
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <p className="text-sm text-gray-600">Minutes consumed by active learners</p>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded">
          {error}
        </div>
      )}

      {!loading && report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
              <p className="text-sm text-gray-500 mb-1">Minutes Taught</p>
              <p className="text-primary text-[27px] font-semibold leading-10">
                {Math.round(report.totalMinutesTaught).toLocaleString()}{" "}
                <span className="text-base font-normal text-gray-500">minutes taught</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Total minutes of lectures learners have collectively viewed over the selected period.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
              <p className="text-sm text-gray-500 mb-1">Active Learners</p>
              <p className="text-primary text-[27px] font-semibold leading-10">
                {report.activeLearners.toLocaleString()}{" "}
                <span className="text-base font-normal text-gray-500">active learners</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Learners who started a lecture during the selected time period.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
            <h2 className="text-gray-700 font-medium mb-4">Minutes taught over time</h2>
            <div className="h-72">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No watch activity in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={28} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => Number(value).toLocaleString()}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${Number(value).toLocaleString()} minutes`, "Minutes taught"]}
                    />
                    <Bar dataKey="minutes" fill="#E88C3C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
            <h2 className="text-gray-700 font-medium mb-3">Course</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Minutes taught</TableHead>
                  <TableHead className="text-right">Active learners</TableHead>
                  <TableHead className="text-right">Minutes per active learner</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.courses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No course engagement found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
                {report.courses.map((course) => (
                  <TableRow key={course.courseId}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{course.courseTitle}</div>
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                          course.isPublished
                            ? "bg-sky-100 text-sky-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {course.isPublished ? "Published" : "Unpublished"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(course.minutesTaught).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {course.activeLearners.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(course.minutesPerActiveLearner).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        className="text-primary text-sm hover:underline"
                        onClick={() => setCourseId(String(course.courseId))}
                      >
                        See details &gt;
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {courseId !== "all" && (
              <button
                type="button"
                className="mt-3 text-sm text-primary hover:underline"
                onClick={() => setCourseId("all")}
              >
                ← Back to all courses
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Engagment;
