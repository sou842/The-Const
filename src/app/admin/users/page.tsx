"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreHorizontal, Loader2, Shield, Ban } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { getter, patcher } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "admin" | "creator";
type UserStatus = "active" | "inactive";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profilePhoto?: string;
  createdAt: string;
  postsCount: number;
}

interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

const roleBadge = (role: UserRole) => {
  const variants: Record<string, string> = {
    admin: "bg-foreground text-background",
    creator: "bg-secondary text-secondary-foreground border",
  };
  return <Badge className={variants[role] || variants.creator}>{role}</Badge>;
};

const statusBadge = (status: UserStatus) => {
  const variants: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-amber-100 text-amber-700",
  };
  return <Badge className={variants[status] || ""}>{status}</Badge>;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [page, setPage] = useState(1);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");
    params.set("sortBy", "createdAt");
    params.set("sortOrder", "desc");
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    return `/api/admin/users?${params.toString()}`;
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  const { data, isLoading, mutate } = useSWR<AdminUsersResponse>(
    user?.role === "admin" ? query : null,
    getter,
    { revalidateOnFocus: false },
  );

  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const handleUpdate = async (targetUser: AdminUser, payload: { role?: UserRole; status?: UserStatus }) => {
    const operation = payload.role ? `role:${payload.role}` : `status:${payload.status}`;
    setActionKey(`${targetUser._id}:${operation}`);
    try {
      await patcher(`/api/admin/users/${targetUser._id}`, payload);
      toast.success("User updated successfully");
      await mutate();
    } catch (error) {
      console.error("Update user error:", error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage platform users</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value: "all" | UserRole) => setRoleFilter(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value: "all" | UserStatus) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-sm text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-sm text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : users.map((currentUser) => (
                <TableRow key={currentUser._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={currentUser.profilePhoto} />
                        <AvatarFallback>{currentUser.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleBadge(currentUser.role)}</TableCell>
                  <TableCell>{statusBadge(currentUser.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">{currentUser.postsCount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {actionKey?.startsWith(`${currentUser._id}:`) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {currentUser.role === "creator" ? (
                          <DropdownMenuItem onClick={() => handleUpdate(currentUser, { role: "admin" })}>
                            <Shield className="h-4 w-4 mr-2" />
                            Promote to Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUpdate(currentUser, { role: "creator" })}>
                            <Shield className="h-4 w-4 mr-2" />
                            Change to Creator
                          </DropdownMenuItem>
                        )}
                        {currentUser.status === "active" ? (
                          <DropdownMenuItem onClick={() => handleUpdate(currentUser, { status: "inactive" })}>
                            <Ban className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUpdate(currentUser, { status: "active" })}>
                            <Ban className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <p className="text-muted-foreground">Total users: {total}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
