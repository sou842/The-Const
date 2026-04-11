"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { AlertTriangle, CheckCircle2, Loader2, Search, ShieldAlert, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getter, patcher } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

type ReportStatus = "pending" | "dismissed" | "resolved";
type ReportReason = "spam" | "harassment" | "misinformation" | "hate" | "violence" | "other";

interface ReportEntry {
  _id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  adminAction: "none" | "dismissed" | "rejected_blog";
  createdAt: string;
  resolvedAt?: string;
  reporter?: {
    _id?: string;
    name?: string;
    email?: string;
    profilePhoto?: string;
  };
  blog?: {
    _id?: string;
    title?: string;
    author?: string;
    status?: string;
    url?: string;
    summary?: string;
  };
}

interface ReportsApiResponse {
  reports: ReportEntry[];
  total: number;
  page: number;
  totalPages: number;
  summary: {
    pending: number;
    dismissed: number;
    resolved: number;
  };
}

const reasonLabelMap: Record<ReportReason, string> = {
  spam: "Spam",
  harassment: "Harassment",
  misinformation: "Misinformation",
  hate: "Hate Speech",
  violence: "Violence",
  other: "Other",
};

const reasonBadgeClass: Record<ReportReason, string> = {
  spam: "bg-amber-100 text-amber-700",
  harassment: "bg-orange-100 text-orange-700",
  misinformation: "bg-sky-100 text-sky-700",
  hate: "bg-red-100 text-red-700",
  violence: "bg-rose-100 text-rose-700",
  other: "bg-secondary text-secondary-foreground",
};

const statusBadgeClass: Record<ReportStatus, string> = {
  pending: "bg-red-100 text-red-700",
  dismissed: "bg-zinc-200 text-zinc-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

function ReportCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-14 w-full" />
        <div className="flex justify-between gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-52" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [reasonFilter, setReasonFilter] = useState<"all" | ReportReason>("all");
  const [page, setPage] = useState(1);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, reasonFilter]);

  const queryKey = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (reasonFilter !== "all") params.set("reason", reasonFilter);
    return `/api/admin/reports?${params.toString()}`;
  }, [debouncedSearch, statusFilter, reasonFilter, page]);

  const { data, isLoading, mutate } = useSWR<ReportsApiResponse>(
    user?.role === "admin" ? queryKey : null,
    getter,
    { revalidateOnFocus: false },
  );

  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const summary = data?.summary ?? { pending: 0, dismissed: 0, resolved: 0 };

  const processReport = async (reportId: string, action: "dismiss" | "remove") => {
    setActionKey(`${reportId}:${action}`);
    try {
      await patcher(`/api/admin/reports/${reportId}`, { action });
      toast.success(action === "dismiss" ? "Report dismissed" : "Article removed from approved feed");
      await mutate();
    } catch (error) {
      console.error("Process report error:", error);
    } finally {
      setActionKey(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user.role !== "admin") return null;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Review flagged articles and take moderation action</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          {summary.pending} pending
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-red-100 bg-red-50/40">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 bg-zinc-50/70">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Dismissed</p>
            <p className="text-2xl font-bold text-zinc-700 mt-1">{summary.dismissed}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{summary.resolved}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Moderation Queue</CardTitle>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reason, reporter, author, or title..."
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: "all" | ReportStatus) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={(value: "all" | ReportReason) => setReasonFilter(value)}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All reasons</SelectItem>
                {Object.entries(reasonLabelMap).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <ReportCardSkeleton />
              <ReportCardSkeleton />
              <ReportCardSkeleton />
            </>
          ) : reports.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium">No reports found</p>
              <p className="text-sm text-muted-foreground mt-1">Try changing your search or filters.</p>
            </div>
          ) : (
            reports.map((report) => {
              const actionLoadingDismiss = actionKey === `${report._id}:dismiss`;
              const actionLoadingRemove = actionKey === `${report._id}:remove`;
              const isPending = report.status === "pending";

              return (
                <Card key={report._id} className="border-border/70">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={reasonBadgeClass[report.reason]}>
                            {reasonLabelMap[report.reason]}
                          </Badge>
                          <Badge className={statusBadgeClass[report.status]}>{report.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold text-base leading-tight">
                            {report.blog?.title || "Deleted article"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Author: <span className="text-foreground font-medium">{report.blog?.author || "Unknown"}</span>
                          </p>
                        </div>

                        {report.blog?.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{report.blog.summary}</p>
                        )}

                        <p className="text-sm bg-muted/60 rounded-lg p-3 leading-relaxed line-clamp-3">
                          {report.details}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={report.reporter?.profilePhoto} />
                              <AvatarFallback className="text-[10px]">
                                {(report.reporter?.name || "U").slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>Reported by {report.reporter?.name || report.reporter?.email || "Unknown user"}</span>
                          </div>

                          {report.blog?.url && (
                            <a
                              href={`/blog/${report.blog.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-foreground hover:underline"
                            >
                              Open article
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700"
                          onClick={() => processReport(report._id, "dismiss")}
                          disabled={!isPending || actionLoadingDismiss || actionLoadingRemove}
                        >
                          {actionLoadingDismiss ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => processReport(report._id, "remove")}
                          disabled={!isPending || actionLoadingDismiss || actionLoadingRemove}
                        >
                          {actionLoadingRemove ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">Total reports: {total}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || isLoading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
