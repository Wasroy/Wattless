import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => (
  <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
    <div className="container flex h-16 items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold tracking-tight">WATLESS</span>
        <span className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
          Nerve
        </span>
      </div>
      <div className="hidden items-center gap-8 md:flex">
        <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Fonctionnement
        </a>
        <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Features
        </a>
        <a href="#dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Dashboard
        </a>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Docs
        </Button>
        <Button size="sm">
          Commencer
        </Button>
      </div>
    </div>
  </nav>
);

export default Navbar;
