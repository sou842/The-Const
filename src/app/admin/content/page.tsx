"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreHorizontal, Eye, Trash2, Flag, CheckCircle } from "lucide-react";

const posts = [
  { id: "1", title: "The Future of AI in Healthcare", author: "Sarah Chen", status: "published", views: 2400, reports: 0, date: "Mar 28, 2026" },
  { id: "2", title: "Building Scalable Systems", author: "Marcus Johnson", status: "published", views: 1800, reports: 2, date: "Mar 27, 2026" },
  { id: "3", title: "Design Systems at Scale", author: "Aisha Patel", status: "draft", views: 0, reports: 0, date: "Mar 26, 2026" },
  { id: "4", title: "Remote Work Best Practices", author: "Elena Volkov", status: "published", views: 3200, reports: 0, date: "Mar 25, 2026" },
  { id: "5", title: "Controversial Opinion Post", author: "David Kim", status: "flagged", views: 890, reports: 5, date: "Mar 24, 2026" },
  { id: "6", title: "Getting Started with Rust", author: "James Wright", status: "published", views: 1500, reports: 0, date: "Mar 23, 2026" },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700",
    draft: "bg-secondary text-secondary-foreground",
    flagged: "bg-red-100 text-red-700",
  };
  return <Badge className={map[status] || ""}>{status}</Badge>;
};

export default function AdminContentPage() {
  const [search, setSearch] = useState("");
  const filtered = posts.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Content</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage posts and articles</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="flagged">Flagged ({posts.filter((p) => p.status === "flagged").length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium text-sm max-w-[250px] truncate">{post.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{post.author}</TableCell>
                      <TableCell>{statusBadge(post.status)}</TableCell>
                      <TableCell className="text-sm">{post.views.toLocaleString()}</TableCell>
                      <TableCell>
                        {post.reports > 0 ? (
                          <Badge variant="destructive" className="text-xs">{post.reports}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{post.date}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                            <DropdownMenuItem><CheckCircle className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>
                            <DropdownMenuItem><Flag className="h-4 w-4 mr-2" />Flag</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published" className="mt-4">
          <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Showing published posts</CardContent></Card>
        </TabsContent>
        <TabsContent value="flagged" className="mt-4">
          <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Showing flagged posts for review</CardContent></Card>
        </TabsContent>
        <TabsContent value="drafts" className="mt-4">
          <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Showing draft posts</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
