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
  EngagementMinuteType,
  EngagementPeriod,
} from "../../../utils/courseEngagementService";

const PERIODS: { value: EngagementPeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "12m+", label: "Last 12+ months" },
];

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const Engagment = () => {
  const now = new Date();
  const [report, setReport] = useState<CourseEngagementReport | null>(null);
  const [courses, setCourses] = useState<EngagementCourseOption[]>([]);
  const [period, setPeriod] = useState<EngagementPeriod | "month">("month");
  const [courseId, setCourseId] = useState<string>("all");
  const [minuteType, setMinuteType] = useState<EngagementMinuteType>("all");
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1));
  const [year, setYear] = useState<string>(String(now.getFullYear()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

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
      const useMonth = period === "month";
      const data = await courseEngagementService.getReport(
        useMonth ? "month" : period,
        selectedCourseId,
        useMonth ? Number(year) : null,
        useMonth ? Number(month) : null,
        minuteType
      );
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
  }, [period, courseId, month, year, minuteType]);

  const chartData = (report?.series || []).map((point) => ({
    label: point.label,
    minutes: Math.round(point.minutesTaught),
    paidMinutes: Math.round(point.paidMinutes || 0),
    freePreviewMinutes: Math.round(point.freePreviewMinutes || 0),
  }));

  const selectedMonthLabel =
    MONTHS.find((m) => m.value === month)?.label || month;

  const getMinuteTypeTitle = () => {
    if (minuteType === "paid") return "Paid Content Minutes";
    if (minuteType === "free_preview") return "Free / Preview Minutes";
    return "Total Minutes Taught";
  };

  return (
    <div className="space-y-4">
      {/* Compact Filters Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-gray-800 tracking-tight">Course Engagement</h1>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500 font-medium">
              {period === "month" ? `${selectedMonthLabel} ${year}` : PERIODS.find(p => p.value === period)?.label}
            </span>
            {minuteType === "paid" && (
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ 100% Matches Payout Minutes
              </span>
            )}
            {minuteType === "free_preview" && (
              <span className="text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                Free &amp; Preview Content
              </span>
            )}
          </div>
          <Button
            onClick={loadReport}
            disabled={loading}
            size="sm"
            variant="outline"
            className="h-8 text-xs font-semibold border-primary text-primary hover:bg-primary hover:text-white"
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Course filter */}
          <div className="flex-1 min-w-[200px]">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="h-8 text-xs bg-gray-50/50 border-gray-300">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All courses ({courses.length})</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.courseId} value={String(c.courseId)}>
                    {c.courseTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Minute Category Filter */}
          <div className="w-[170px]">
            <Select
              value={minuteType}
              onValueChange={(v) => setMinuteType(v as EngagementMinuteType)}
            >
              <SelectTrigger className="h-8 text-xs bg-gray-50/50 border-gray-300 font-medium">
                <SelectValue placeholder="Minute type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Minutes</SelectItem>
                <SelectItem value="paid">💎 Paid Minutes</SelectItem>
                <SelectItem value="free_preview">🎁 Free / Preview</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period selector */}
          <div className="w-[150px]">
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as EngagementPeriod | "month")}
            >
              <SelectTrigger className="h-8 text-xs bg-gray-50/50 border-gray-300">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="month">Specific month</SelectItem>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {period === "month" && (
            <>
              <div className="w-[130px]">
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="h-8 text-xs bg-gray-50/50 border-gray-300">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[95px]">
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="h-8 text-xs bg-gray-50/50 border-gray-300">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && report && (
        <>
          {/* Compact KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Minutes Taught KPI Card */}
            <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {minuteType === "paid" ? "Paid Minutes" : minuteType === "free_preview" ? "Free / Preview Min" : "Minutes Taught"}
                  </span>
                  {minuteType === "paid" && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                      Paid Only
                    </span>
                  )}
                  {minuteType === "free_preview" && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                      Free Only
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-gray-900 text-2xl font-bold tracking-tight">
                    {Math.round(report.totalMinutesTaught).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">min</span>
                </div>
              </div>

              {/* Breakdown Strip */}
              <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMinuteType("paid")}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer hover:shadow-sm ${
                    minuteType === "paid"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  }`}
                  title="Click to filter report by Paid Content Minutes"
                >
                  💎 <strong>{Math.round(report.paidMinutesTaught || 0).toLocaleString()}m</strong> paid
                </button>
                <button
                  type="button"
                  onClick={() => setMinuteType("free_preview")}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer hover:shadow-sm ${
                    minuteType === "free_preview"
                      ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  }`}
                  title="Click to filter report by Free & Preview Minutes"
                >
                  🎁 <strong>{Math.round(report.freePreviewMinutesTaught || 0).toLocaleString()}m</strong> free
                </button>
              </div>
            </div>

            {/* Active Learners KPI Card */}
            <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Learners</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-gray-900 text-2xl font-bold tracking-tight">
                    {report.activeLearners.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">learners</span>
                </div>
              </div>

              {/* Breakdown Strip */}
              <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMinuteType("paid")}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer hover:shadow-sm ${
                    minuteType === "paid"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                  }`}
                  title="Click to filter by Paid Students Activity"
                >
                  👤 <strong>{(report.paidActiveLearners || 0).toLocaleString()}</strong> paid
                </button>
                <button
                  type="button"
                  onClick={() => setMinuteType("free_preview")}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer hover:shadow-sm ${
                    minuteType === "free_preview"
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                  }`}
                  title="Click to filter by Free / Preview Students Activity"
                >
                  👥 <strong>{(report.freePreviewActiveLearners || 0).toLocaleString()}</strong> free
                </button>
              </div>
            </div>

            {/* Avg per Learner KPI Card */}
            <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Avg / Learner</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-gray-900 text-2xl font-bold tracking-tight">
                    {report.activeLearners ? Math.round(report.totalMinutesTaught / report.activeLearners).toLocaleString() : 0}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">min / learner</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 text-xs text-gray-500">
                Average viewing duration per active student
              </div>
            </div>
          </div>

          {/* Time Series Chart */}
          <div className="p-6 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-gray-700 font-medium">Minutes taught over time</h2>
              <div className="flex items-center gap-3 text-xs">
                {minuteType === "all" ? (
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-3 h-3 rounded-sm bg-[#E88C3C] inline-block" /> Total Minutes
                  </span>
                ) : minuteType === "paid" ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" /> Paid Minutes
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Free / Preview Minutes
                  </span>
                )}
              </div>
            </div>
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
                      formatter={(value: number) => [
                        `${Number(value).toLocaleString()} minutes`,
                        minuteType === "paid"
                          ? "Paid Minutes"
                          : minuteType === "free_preview"
                          ? "Free / Preview Minutes"
                          : "Minutes taught",
                      ]}
                    />
                    <Bar
                      dataKey="minutes"
                      fill={
                        minuteType === "paid"
                          ? "#059669"
                          : minuteType === "free_preview"
                          ? "#D97706"
                          : "#E88C3C"
                      }
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Course Table */}
          <div className="p-4 bg-white rounded-lg shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-gray-700 font-medium">Course Breakdown</h2>
              <span className="text-xs text-gray-500">
                Showing {report.courses.length} {report.courses.length === 1 ? "course" : "courses"}
              </span>
            </div>
            <div className="overflow-y-auto max-h-[380px] border border-gray-100 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Minutes taught</TableHead>
                  <TableHead className="text-right">Paid / Free Breakdown</TableHead>
                  <TableHead className="text-right">Active learners</TableHead>
                  <TableHead className="text-right">Minutes per active learner</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.courses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
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
                    <TableCell className="text-right font-semibold">
                      {Math.round(course.minutesTaught).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs">
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium border border-emerald-200" title="Paid Content Minutes">
                          💎 {Math.round(course.paidMinutes || 0).toLocaleString()}m
                        </span>
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200" title="Free / Preview Minutes">
                          🎁 {Math.round(course.freePreviewMinutes || 0).toLocaleString()}m
                        </span>
                      </div>
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
            </div>
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

