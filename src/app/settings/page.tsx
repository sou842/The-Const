import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <AppLayout>
      <div className="pb-20 md:pb-4">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Account */}
          <section className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold mb-4">Account</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" className="mt-1.5 max-w-sm" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="john@example.com" className="mt-1.5 max-w-sm" />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" defaultValue="Senior Software Engineer" className="mt-1.5 max-w-sm" />
              </div>
              <Button size="sm">Save Changes</Button>
            </div>
          </section>

          <Separator />

          {/* Notifications */}
          <section className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold mb-4">Notifications</h2>
            <div className="space-y-4">
              {["Email notifications", "Push notifications", "Message notifications", "Connection requests"].map((label) => (
                <div key={label} className="flex items-center justify-between">
                  <Label className="font-normal">{label}</Label>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Privacy */}
          <section className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold mb-4">Privacy</h2>
            <div className="space-y-4">
              {["Profile visible to public", "Show online status", "Allow search engines to index"].map((label) => (
                <div key={label} className="flex items-center justify-between">
                  <Label className="font-normal">{label}</Label>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold text-destructive mb-2">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all data.</p>
            <Button variant="destructive" size="sm">Delete Account</Button>
          </section>
        </div>
      </div>
      <MobileNav />
    </AppLayout>
  );
}
