"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Loader2 } from "lucide-react";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("first") as string;
    const lastName = formData.get("last") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const name = `${firstName} ${lastName}`.trim();

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast({
        title: "Account Created Successfully",
        description: "Welcome to The Const! Please sign in to continue.",
      });

      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-1 bg-foreground text-background items-center justify-center p-16 relative overflow-hidden">
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Floating Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />

        <div className="max-w-md relative z-10 transition-all duration-700 animate-in fade-in slide-in-from-left-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/10 border border-background/10 text-xs font-medium mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Join 50K+ Professionals
          </div>
          <h1 className="font-display text-6xl font-bold mb-6 tracking-tight leading-[1.1]">
            Create your <span className="text-primary italic">legacy</span>.
          </h1>
          <p className="text-xl opacity-60 leading-relaxed mb-10 font-light">
            Join the global community of thinkers and doers shaping the future of industries.
          </p>

          <div className="p-8 rounded-[32px] bg-background/5 border border-background/10 backdrop-blur-md relative group overflow-hidden transition-all duration-500 hover:bg-background/10">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <User className="w-24 h-24" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-6 opacity-40">Trusted Worldwide</p>
            <div className="flex items-center gap-8">
              <div className="space-y-1">
                <span className="text-4xl font-bold tracking-tighter">120+</span>
                <p className="text-[10px] items-center gap-1 flex opacity-40 font-bold uppercase tracking-widest"><span className="w-1 h-1 rounded-full bg-primary" /> Countries</p>
              </div>
              <div className="h-12 w-px bg-background/10" />
              <div className="space-y-1">
                <span className="text-4xl font-bold tracking-tighter">50K+</span>
                <p className="text-[10px] items-center gap-1 flex opacity-40 font-bold uppercase tracking-widest"><span className="w-1 h-1 rounded-full bg-primary" /> Members</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-card/20 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden mb-12">
            <h1 className="font-display text-3xl font-bold tracking-tight">The Const</h1>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">Create account</h2>
            <p className="text-sm text-muted-foreground font-light">
              Begin your professional journey with a few simple steps
            </p>
          </div>

          <form className="space-y-5 mt-8" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first" className="text-xs uppercase tracking-widest font-semibold opacity-70">First Name</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="first"
                    name="first"
                    placeholder="Jane"
                    className="pl-10 h-12 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="last" className="text-xs uppercase tracking-widest font-semibold opacity-70">Last Name</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="last"
                    name="last"
                    placeholder="Doe"
                    className="pl-10 h-12 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest font-semibold opacity-70">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jane.doe@example.com"
                  className="pl-10 h-12 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-widest font-semibold opacity-70">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium opacity-50 pl-1 uppercase tracking-wider">Minimum 8 characters required</p>
            </div>

            <div className="flex items-center gap-3 py-2">
              <Checkbox id="terms" className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary" required />
              <Label htmlFor="terms" className="text-xs leading-relaxed font-normal text-muted-foreground cursor-pointer select-none">
                I agree to the <button type="button" className="text-primary font-semibold hover:underline underline-offset-2">Terms of Service</button> and <button type="button" className="text-primary font-semibold hover:underline underline-offset-2">Privacy Policy</button>
              </Label>
            </div>

            <Button className="w-full group h-12 rounded-xl text-sm font-semibold relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted-foreground/10" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
              <span className="bg-background px-4 text-muted-foreground/50">One-Tap Auth</span>
            </div>
          </div>

          {/* OAuth Buttons Section - Replace existing grid */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-11 rounded border-muted-foreground/10 hover:bg-muted/50 transition-colors"
              onClick={() => window.location.href = '/api/auth/oauth/google?callbackUrl=/'}
              type="button"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded border-muted-foreground/10 hover:bg-muted/50 transition-colors"
              onClick={() => window.location.href = '/api/auth/oauth/github?callbackUrl=/'}
              type="button"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          <p className="mt-12 text-center text-xs text-muted-foreground font-light">
            Already a member?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4 decoration-2">
              Sign into platform
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
