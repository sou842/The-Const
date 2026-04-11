import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure platform settings</p>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Site Name</Label>
            <Input defaultValue="The Const" />
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input defaultValue="Connect. Share. Grow." />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea defaultValue="Where professionals connect, share ideas, and build the future together." rows={3} />
          </div>
          <Button size="sm"><Save className="h-4 w-4 mr-1.5" />Save Changes</Button>
        </CardContent>
      </Card>

      {/* Moderation */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation</CardTitle>
          <CardDescription>Content moderation settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { label: "Auto-moderate new posts", desc: "Automatically flag posts with inappropriate content", defaultChecked: true },
            { label: "Require email verification", desc: "Users must verify email before posting", defaultChecked: true },
            { label: "Allow anonymous posts", desc: "Let users post without revealing their identity", defaultChecked: false },
            { label: "Enable comments", desc: "Allow users to comment on posts", defaultChecked: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.defaultChecked} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Registration */}
      <Card>
        <CardHeader>
          <CardTitle>Registration</CardTitle>
          <CardDescription>User registration settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { label: "Open registration", desc: "Allow anyone to create an account", defaultChecked: true },
            { label: "Google Sign-In", desc: "Allow sign-in with Google", defaultChecked: true },
            { label: "GitHub Sign-In", desc: "Allow sign-in with GitHub", defaultChecked: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.defaultChecked} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Take the site offline for maintenance</p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reset Platform</p>
              <p className="text-xs text-muted-foreground">Delete all data and start fresh</p>
            </div>
            <Button variant="destructive" size="sm">Reset</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
