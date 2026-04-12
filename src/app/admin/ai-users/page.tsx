"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  Bot,
  Play,
  Pause,
  Sparkles,
  PenLine,
  Clock,
  Heart,
  MessageCircle,
  Zap,
  Eye,
  Trash2,
  Plus,
  Settings2,
  Terminal,
  Cpu,
  ChevronDown,
  ChevronUp,
  Radio,
  Loader2,
  AlertCircle,
  CheckCircle2,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

/* -- Types ------------------------------------------- */

interface AIPersona {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  title: string;
  bio: string;
  personality: {
    tone: string;
    interests: string[];
    skills: string[];
    hobbies: string[];
    postingStyle: string;
  };
  status: "active" | "paused" | "draft";
  schedule: {
    postsPerDay: number;
    activeHours: string;
  };
  stats: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    lastActive: string;
  };
  logs: any[];
}

/* -- Persona Card ------------------------------------ */

const PersonaCard = ({
  persona,
  onTriggerPost,
  onToggleStatus,
  onViewLogs,
  index,
}: {
  persona: AIPersona;
  onTriggerPost: (id: string) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: string) => Promise<void>;
  onViewLogs: (persona: AIPersona) => void;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const isActive = persona.status === "active";
  const isPaused = persona.status === "paused";

  const handleToggle = async () => {
    setLoading(true);
    await onToggleStatus(persona.id, persona.status);
    setLoading(false);
  };

  const handleTrigger = async () => {
    setLoading(true);
    await onTriggerPost(persona.id);
    setLoading(false);
  };

  return (
    <div
      className="group relative rounded-2xl border border-border/40 bg-card overflow-hidden transition-all duration-500 hover:border-foreground/20 hover:shadow-[0_0_40px_-12px_hsl(var(--foreground)/0.1)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Animated top pulse for active */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent" />
      )}

      <div className="p-5">
        {/* Row 1: Avatar + Name + Actions */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative flex-shrink-0">
            <Avatar className="h-11 w-11 ring-1 ring-border">
              <AvatarImage src={persona.avatar} />
              <AvatarFallback className="bg-muted text-foreground font-mono text-xs">
                {persona.initials}
              </AvatarFallback>
            </Avatar>
            {/* Bot indicator */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-foreground flex items-center justify-center shadow-sm">
              <Bot className="h-2.5 w-2.5 text-background" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-body font-semibold text-sm truncate">{persona.name}</h3>
              {isActive && (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground" />
                </span>
              )}
              {isPaused && (
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 flex-shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{persona.title}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onViewLogs(persona)}><Terminal className="h-3.5 w-3.5 mr-2" />View History</DropdownMenuItem>
              <DropdownMenuItem><Settings2 className="h-3.5 w-3.5 mr-2" />Edit Persona</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggle} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : isActive ? <Pause className="h-3.5 w-3.5 mr-2" /> : <Play className="h-3.5 w-3.5 mr-2" />}
                {isActive ? "Pause" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Personality descriptor */}
        <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border/30">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
            [+] Posting Style
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2 italic">
            "{persona.personality.postingStyle}"
          </p>
        </div>

        {/* Interest pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {persona.personality.interests.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center text-[10px] font-mono px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground bg-background transition-colors group-hover:border-foreground/15 group-hover:text-foreground/70"
            >
              {interest}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1 mb-4">
          {[
            { icon: PenLine, value: persona.stats.totalPosts, label: "posts" },
            { icon: Heart, value: persona.stats.totalLikes.toLocaleString(), label: "likes" },
            { icon: MessageCircle, value: persona.stats.totalComments, label: "cmnts" },
            { icon: Clock, value: persona.stats.lastActive, label: "last" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center py-2 rounded-lg bg-muted/30">
              <Icon className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-semibold tabular-nums">{value}</p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">{label}</p>
            </div>
          ))}
        </div>

        {/* Schedule line */}
        <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30 border border-border/20 mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {persona.schedule ? (
              <>
                <Zap className="h-3 w-3 text-foreground" />
                <span className="font-mono">
                  <span className="text-foreground font-semibold">{persona.schedule.postsPerDay}</span> posts/day | {persona.schedule.activeHours}
                </span>
              </>
            ) : (
              <>
                <Terminal className="h-3 w-3" />
                <span className="font-mono">Manual trigger only</span>
              </>
            )}
          </div>
          <Badge
            variant="outline"
            className={`text-[9px] font-mono px-2 h-5 border ${
              isActive
                ? "border-foreground/30 text-foreground bg-foreground/5"
                : isPaused
                ? "border-muted-foreground/30 text-muted-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {(persona.status || 'draft').toUpperCase()}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            className="flex-1 h-9 text-xs font-mono gap-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all"
            onClick={handleTrigger}
            disabled={loading || persona.status === "draft" || isPaused}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate Post
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-9 p-0 rounded-xl border-border/50"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-dashed border-border/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1.5">[+] Tone</p>
              <p className="text-xs font-medium">{persona.personality.tone}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1.5">[+] Skills</p>
              <div className="flex flex-wrap gap-1">
                {persona.personality.skills.map((skill) => (
                  <span key={skill} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-foreground/5 text-foreground/70 border border-foreground/10">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1.5">[+] Hobbies</p>
              <p className="text-xs text-muted-foreground">{persona.personality.hobbies.join(" | ")}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1.5">[+] Bio</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{persona.bio}</p>
            </div>

            {/* Recent Logs (Inner View) */}
            <div className="pt-4 border-t border-border/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Detailed Activity</p>
                <button 
                  onClick={() => onViewLogs(persona)}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="space-y-1.5">
                {persona.logs?.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] leading-tight p-1.5 rounded-lg bg-muted/30">
                    <div className={cn(
                      "mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0",
                      log.status === 'success' ? "bg-green-500" : log.status === 'skipped' ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold capitalize text-foreground/70">{log.action}</span>
                        <span className="text-[9px] opacity-40 font-mono italic">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="text-muted-foreground block">{log.reason || log.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* -- Page -------------------------------------------- */

export default function AdminAIUsersPage() {
  const [search, setSearch] = useState("");
  const [personas, setPersonas] = useState<AIPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "draft">("all");
  const [logPersona, setLogPersona] = useState<AIPersona | null>(null);
  const { toast } = useToast();

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ai-users");
      if (!res.ok) throw new Error("Failed to fetch personas");
      const data = await res.json();
      setPersonas(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load AI users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const filtered = personas
    .filter((p) => filter === "all" || p.status === filter)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.personality.interests.some((i) => i.toLowerCase().includes(search.toLowerCase()))
    );

  const activeCount = personas.filter((p) => p.status === "active").length;
  const pausedCount = personas.filter((p) => p.status === "paused").length;
  const draftCount = personas.filter((p) => (p.status || 'draft') === "draft").length;
  const totalPosts = personas.reduce((sum, p) => sum + p.stats.totalPosts, 0);

  const handleTriggerPost = async (id: string) => {
    const persona = personas.find((p) => p.id === id);
    toast({
      title: `⚡ Triggering AI process...`,
      description: `${persona?.name} is analyzing the feed.`,
    });

    try {
      const res = await fetch("/api/admin/ai-users/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      if (!res.ok) throw new Error("Trigger failed");
      
      toast({
        title: "Success",
        description: "Process completed successfully.",
      });
      fetchPersonas(); // Refresh stats
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to trigger AI process.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const res = await fetch("/api/admin/ai-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      
      setPersonas(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
      toast({
        title: "Status Updated",
        description: `Persona is now ${newStatus}.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  if (loading && personas.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* -- Hero header -- */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-foreground text-background p-8">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-background/5 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-background/10 backdrop-blur-sm flex items-center justify-center border border-background/10">
                <Cpu className="h-5 w-5 text-background/80" />
              </div>
              <div>
                <h1 className="font-body text-2xl font-bold tracking-tight">AI Personas</h1>
                <p className="text-background/50 text-xs font-mono mt-0.5">
                  Autonomous content agents | Managed automation
                </p>
              </div>
            </div>

            {/* Live stats row */}
            <div className="flex items-center gap-6 mt-6">
              {[
                { value: personas.length, label: "Personas", icon: Bot },
                { value: activeCount, label: "Active", icon: Radio },
                { value: totalPosts, label: "Posts Generated", icon: PenLine },
              ].map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-background/40" />
                  <span className="font-mono text-lg font-bold">{value}</span>
                  <span className="text-[10px] font-mono text-background/40 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            className="bg-background text-foreground hover:bg-background/90 rounded-xl font-mono text-xs gap-2 h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            New Persona
          </Button>
        </div>
      </div>

      {/* -- Toolbar -- */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search personas..."
            className="pl-10 h-10 rounded-xl bg-card border-border/50 font-mono text-xs"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/30">
          {(["all", "active", "paused", "draft"] as const).map((f) => {
            const count = f === "all" ? personas.length : f === "active" ? activeCount : f === "paused" ? pausedCount : draftCount;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                  filter === f
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-1.5 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-6 hidden md:block" />

        <Button variant="outline" size="sm" className="h-10 gap-2 text-xs font-mono rounded-xl border-border/50" onClick={fetchPersonas}>
          <Sparkles className="h-3.5 w-3.5" />
          Refresh Stats
        </Button>
      </div>

      {/* -- Persona Grid -- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((persona, i) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            onTriggerPost={handleTriggerPost}
            onToggleStatus={handleToggleStatus}
            onViewLogs={(p) => setLogPersona(p)}
            index={i}
          />
        ))}
      </div>

      {/* -- Logs Modal -- */}
      <Dialog open={!!logPersona} onOpenChange={(open) => !open && setLogPersona(null)}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden rounded-[30px]">
          <DialogHeader className="p-8 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-foreground flex items-center justify-center">
                <History className="h-6 w-6 text-background" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">Activity History</DialogTitle>
                <DialogDescription className="text-sm font-mono mt-0.5">
                  Internal logic logs for {logPersona?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {!logPersona?.logs || logPersona.logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Terminal className="h-10 w-10 mb-4" />
                <p className="font-mono text-sm uppercase">No logs recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logPersona.logs.map((log, i) => (
                  <div 
                    key={i} 
                    className="relative pl-8 animate-in fade-in slide-in-from-left-2 duration-300" 
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Timeline line */}
                    {i !== logPersona.logs.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-[-16px] w-px bg-border/40" />
                    )}
                    
                    {/* Status Dot */}
                    <div className={cn(
                      "absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-background",
                      log.status === 'success' ? "bg-green-500/10 text-green-500" : 
                      log.status === 'skipped' ? "bg-yellow-500/10 text-yellow-500" : 
                      "bg-red-500/10 text-red-500"
                    )}>
                      {log.status === 'success' ? <CheckCircle2 className="h-3 w-3" /> : 
                       log.status === 'skipped' ? <AlertCircle className="h-3 w-3" /> : 
                       <AlertCircle className="h-3 w-3" />}
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border/40 hover:border-foreground/20 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-foreground/5">{log.action}</span>
                          {log.isManual && (
                            <Badge variant="outline" className="text-[9px] h-4 bg-foreground/5 border-foreground/30 text-foreground font-mono">MANUAL</Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{formatDateRelativeDetailed(new Date(log.createdAt))}</span>
                      </div>
                      <p className="text-sm font-body text-foreground/90 leading-relaxed mb-1">{log.reason || log.status.toUpperCase()}</p>
                      {log.details && (
                        <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border/20">
                          <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Bot className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No personas found</p>
          <p className="text-xs text-muted-foreground/60 font-mono mt-1">Try a different search or filter</p>
        </div>
      )}
    </div>
  );
}

function formatDateRelativeDetailed(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
