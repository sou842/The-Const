"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, UserPlus, Shield, Ban, Trash2 } from "lucide-react";

const users = [
  { id: "1", name: "Sarah Chen", email: "sarah.chen@email.com", avatar: "https://pravatar.cc/150?img=1", role: "admin", status: "active", joined: "Jan 12, 2026", posts: 142 },
  { id: "2", name: "Marcus Johnson", email: "marcus.j@email.com", avatar: "https://pravatar.cc/150?img=2", role: "moderator", status: "active", joined: "Feb 3, 2026", posts: 89 },
  { id: "3", name: "Aisha Patel", email: "aisha.p@email.com", avatar: "https://pravatar.cc/150?img=3", role: "user", status: "active", joined: "Mar 15, 2026", posts: 56 },
  { id: "4", name: "David Kim", email: "david.kim@email.com", avatar: "https://pravatar.cc/150?img=4", role: "user", status: "suspended", joined: "Jan 28, 2026", posts: 23 },
  { id: "5", name: "Elena Volkov", email: "elena.v@email.com", avatar: "https://pravatar.cc/150?img=5", role: "user", status: "active", joined: "Mar 1, 2026", posts: 67 },
  { id: "6", name: "James Wright", email: "james.w@email.com", avatar: "https://pravatar.cc/150?img=6", role: "user", status: "banned", joined: "Dec 5, 2025", posts: 12 },
];

const roleBadge = (role: string) => {
  const variants: Record<string, string> = {
    admin: "bg-foreground text-background",
    moderator: "bg-secondary text-secondary-foreground border",
    user: "bg-muted text-muted-foreground",
  };
  return <Badge className={variants[role] || variants.user}>{role}</Badge>;
};

const statusBadge = (status: string) => {
  const variants: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    suspended: "bg-amber-100 text-amber-700",
    banned: "bg-red-100 text-red-700",
  };
  return <Badge className={variants[status] || ""}>{status}</Badge>;
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage platform users</p>
        </div>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleBadge(user.role)}</TableCell>
                  <TableCell>{statusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.joined}</TableCell>
                  <TableCell className="text-sm">{user.posts}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Shield className="h-4 w-4 mr-2" />Change Role</DropdownMenuItem>
                        <DropdownMenuItem><Ban className="h-4 w-4 mr-2" />Suspend</DropdownMenuItem>
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
    </div>
  );
}
