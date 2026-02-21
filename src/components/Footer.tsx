import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-secondary/20 py-12">
    <div className="container">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-bold">WATTLESS</span>
          <span className="font-mono text-xs text-muted-foreground">Nerve</span>
        </div>
        <div className="flex gap-6 font-mono text-xs text-muted-foreground">
          <a href="#" className="transition-colors hover:text-foreground">GitHub</a>
          <a href="#" className="transition-colors hover:text-foreground">Docs</a>
          <a href="#" className="transition-colors hover:text-foreground">Blog</a>
          <a href="#" className="transition-colors hover:text-foreground">Contact</a>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          © 2025 WATTLESS. Tous droits réservés.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
