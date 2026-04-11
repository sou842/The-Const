import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const reports = [
  {
    id: "1",
    type: "Spam",
    content: "Buy followers now! Visit spamlink.com for...",
    reportedBy: { name: "Sarah Chen", avatar: "https://pravatar.cc/150?img=1" },
    author: "SpamBot42",
    date: "2 hours ago",
    priority: "high",
  },
  {
    id: "2",
    type: "Harassment",
    content: "This user has been sending threatening messages to multiple users...",
    reportedBy: { name: "Marcus Johnson", avatar: "https://pravatar.cc/150?img=2" },
    author: "David Kim",
    date: "5 hours ago",
    priority: "high",
  },
  {
    id: "3",
    type: "Misinformation",
    content: "Claiming unverified health advice as medical fact...",
    reportedBy: { name: "Aisha Patel", avatar: "https://pravatar.cc/150?img=3" },
    author: "HealthGuru99",
    date: "1 day ago",
    priority: "medium",
  },
];

const priorityBadge = (p: string) => {
  const map: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-secondary text-secondary-foreground",
  };
  return <Badge className={map[p] || ""}>{p}</Badge>;
};

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Review flagged content and user reports</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          {reports.length} pending
        </Badge>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{report.type}</Badge>
                    {priorityBadge(report.priority)}
                    <span className="text-xs text-muted-foreground">{report.date}</span>
                  </div>

                  <p className="text-sm bg-secondary/50 rounded-lg p-3 mb-3 line-clamp-2">"{report.content}"</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={report.reportedBy.avatar} />
                        <AvatarFallback className="text-[10px]">{report.reportedBy.name[0]}</AvatarFallback>
                      </Avatar>
                      Reported by {report.reportedBy.name}
                    </div>
                    <span>Author: <span className="font-medium text-foreground">{report.author}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                  <Button size="sm" variant="destructive">
                    <XCircle className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
