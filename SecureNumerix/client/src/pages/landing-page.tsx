
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="container mx-auto py-4">
        <nav className="flex justify-between items-center">
          <Logo className="h-8 w-auto" />
          <div className="flex gap-4">
            <Link href="/auth">
              <Button variant="outline">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Your Complete Solution
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl">
          Streamlined workflow, powerful analytics, and everything you need to succeed.
        </p>
        <div className="mt-10">
          <Link href="/auth">
            <Button size="lg" className="px-8">Get Started</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
            <p className="text-muted-foreground">Intuitive interface designed for both beginners and experts.</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Powerful Analytics</h3>
            <p className="text-muted-foreground">Gain insights from comprehensive data visualization tools.</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Secure</h3>
            <p className="text-muted-foreground">Your data is protected with enterprise-grade security measures.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
