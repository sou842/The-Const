import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="font-display text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Oops! The page you&apos;re looking for doesn&apos;t exist.</p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
