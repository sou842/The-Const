import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Eye, FileText, Clock, Globe } from "lucide-react";

const metrics = [
  { label: "Daily Active Users", value: "3,847", change: "+5.2%", icon: Users },
  { label: "Avg. Session Duration", value: "8m 42s", change: "+12%", icon: Clock },
  { label: "Page Views Today", value: "28,401", change: "+18%", icon: Eye },
  { label: "Posts Published Today", value: "156", change: "+3%", icon: FileText },
];

const topPages = [
  { page: "/", views: "12,400", percentage: 43 },
  { page: "/explore", views: "5,200", percentage: 18 },
  { page: "/profile", views: "3,800", percentage: 13 },
  { page: "/messages", views: "2,900", percentage: 10 },
  { page: "/network", views: "2,100", percentage: 7 },
];

const topCountries = [
  { country: "United States", users: "4,200", percentage: 33 },
  { country: "United Kingdom", users: "2,100", percentage: 16 },
  { country: "India", users: "1,800", percentage: 14 },
  { country: "Germany", users: "1,200", percentage: 9 },
  { country: "Canada", users: "980", percentage: 8 },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform performance and insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold mt-1">{m.value}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">{m.change}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <m.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic chart placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Traffic Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-center justify-center border rounded-lg bg-secondary/30">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Traffic chart placeholder</p>
                <p className="text-xs">Connect a backend to view real analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPages.map((p) => (
              <div key={p.page} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium font-mono text-xs">{p.page}</span>
                  <span className="text-muted-foreground">{p.views}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${p.percentage}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCountries.map((c) => (
              <div key={c.country} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.country}</span>
                  <span className="text-muted-foreground">{c.users}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${c.percentage}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
