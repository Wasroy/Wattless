import { Github } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-zinc-100 py-8">
    <div className="container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Link to="/" className="text-sm font-bold text-foreground">
            Wattless
          </Link>
          <div className="flex gap-4 text-xs text-zinc-400">
            <Link to="/mapmonde" className="hover:text-foreground transition-colors">Map</Link>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <a
            href="https://github.com/Wasroy/Wattless"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          <span className="text-zinc-300">Hack Europe 2026</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
