"use client";

import useSWR from "swr";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { getter } from "@/lib/api";
import { UserCard, UserListItem } from "@/components/network/UserCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NetworkUser {
  _id: string;
  name: string;
  profilePhoto?: string;
  profession?: string;
  shortBio?: string;
  location?: string;
}

interface RequestEntry {
  _id: string;
  user: NetworkUser;
}

interface ConnectionEntry {
  _id: string;
  user: NetworkUser;
  updatedAt: string;
}

// ─── Loading Skeletons ────────────────────────────────────────────────────────
function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 bg-card rounded-xl border space-y-3 flex flex-col items-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-xl border p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary">{icon}</span>
        <h2 className="font-semibold text-base">{title}</h2>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {count}
          </Badge>
        )}
      </div>
      {children}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const { data: receivedData, isLoading: loadingReceived, mutate: mutateReceived } =
    useSWR("/api/network/requests?type=received", getter, { revalidateOnFocus: true });

  const { data: sentData, isLoading: loadingSent, mutate: mutateSent } =
    useSWR("/api/network/requests?type=sent", getter, { revalidateOnFocus: true });

  const { data: connectionsData, isLoading: loadingConnections, mutate: mutateConnections } =
    useSWR("/api/network/connections", getter, { revalidateOnFocus: true });

  const { data: suggestionsData, isLoading: loadingSuggestions, mutate: mutateSuggestions } =
    useSWR("/api/network/suggestions", getter, { revalidateOnFocus: true });

  const receivedRequests: RequestEntry[] = receivedData?.requests ?? [];
  const sentRequests: RequestEntry[] = sentData?.requests ?? [];
  const connections: ConnectionEntry[] = connectionsData?.connections ?? [];
  const suggestions: NetworkUser[] = suggestionsData?.suggestions ?? [];

  const refreshAll = () => {
    mutateReceived();
    mutateSent();
    mutateConnections();
    mutateSuggestions();
  };

  return (
    <AppLayout>
      <div className="pb-20 md:pb-4 space-y-5">
        <h1 className="text-2xl font-bold">My Network</h1>

        {/* ── Pending Invitations ── */}
        <Section
          title="Pending Invitations"
          icon={<Users className="h-4 w-4" />}
          count={receivedRequests.length}
        >
          {loadingReceived ? (
            <ListSkeleton count={2} />
          ) : receivedRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No pending invitations.
            </p>
          ) : (
            <div className="divide-y">
              {receivedRequests.map((req) => (
                <UserListItem
                  key={req._id}
                  user={req.user}
                  meta={`Sent you a request`}
                  onStatusChange={refreshAll}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ── Sent Requests ── */}
        {(loadingSent || sentRequests.length > 0) && (
          <Section
            title="Sent Requests"
            icon={<Clock className="h-4 w-4" />}
            count={sentRequests.length}
          >
            {loadingSent ? (
              <ListSkeleton count={2} />
            ) : (
              <div className="divide-y">
                {sentRequests.map((req) => (
                  <UserListItem
                    key={req._id}
                    user={req.user}
                    meta="Awaiting acceptance"
                    onStatusChange={refreshAll}
                  />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── My Connections ── */}
        <Section
          title="My Connections"
          icon={<UserCheck className="h-4 w-4" />}
          count={connectionsData?.total}
        >
          {loadingConnections ? (
            <ListSkeleton count={3} />
          ) : connections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              You have no connections yet. Start connecting with people below!
            </p>
          ) : (
            <div className="divide-y">
              {connections.map((conn) => (
                <UserListItem
                  key={conn._id}
                  user={conn.user}
                  meta={`Connected ${new Date(conn.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                  onStatusChange={refreshAll}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ── People You May Know ── */}
        <Section
          title="People You May Know"
          icon={<Sparkles className="h-4 w-4" />}
        >
          {loadingSuggestions ? (
            <GridSkeleton count={4} />
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No new suggestions right now — check back later!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestions.map((user) => (
                <UserCard key={user._id} user={user} onStatusChange={refreshAll} />
              ))}
            </div>
          )}
        </Section>
      </div>
      <MobileNav />
    </AppLayout>
  );
}
