import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import NumberForm from "@/components/number-form";
import NumberList from "@/components/number-list";
import AiChat from "@/components/ai-chat";
import { motion } from "framer-motion";
import { Logo } from "@/components/logo";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 max-w-2xl mx-auto"
        >
          <NumberForm />
          <NumberList />
        </motion.div>
      </main>

      <AiChat />
    </div>
  );
}