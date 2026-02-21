import { Link, useLocation } from "react-router-dom";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/simulate", label: "Simulate" },
  { to: "/checkpoint", label: "Checkpoint" },
  { to: "/timeshifting", label: "Time-Shifting" },
  { to: "/mapmonde", label: "Map" },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">WATTLESS</span>
          <span className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Nerve
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                location.pathname === link.to
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
