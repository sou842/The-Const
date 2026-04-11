import { BarChart3, Users, FileText, Flag, TrendingUp, Eye, MessageSquare, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Total Users", value: "12,847", change: "+12%", icon: Users },
  { label: "Total Posts", value: "45,291", change: "+8%", icon: FileText },
  { label: "Page Views", value: "1.2M", change: "+24%", icon: Eye },
  { label: "New Signups", value: "342", change: "+18%", icon: UserPlus },
];

const recentActivity = [
  { action: "New user registered", detail: "sarah.chen@email.com", time: "2 min ago" },
  { action: "Post flagged for review", detail: "Inappropriate content reported", time: "15 min ago" },
  { action: "User role updated", detail: "john.doe promoted to moderator", time: "1 hour ago" },
  { action: "Bulk email sent", detail: "Newsletter to 8,432 subscribers", time: "3 hours ago" },
  { action: "New post trending", detail: '"The Future of AI" - 2.4k views', time: "5 hours ago" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your platform</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">{s.change} this month</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts placeholder + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Traffic Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center border rounded-lg bg-secondary/30">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Analytics chart</p>
                <p className="text-xs">Connect a backend to view real data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flag className="h-5 w-5" />
            Pending Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Flag className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No pending reports</p>
            <p className="text-xs">All reported content has been reviewed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
