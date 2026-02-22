import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-7 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Wattless
          </span>
          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full">
            NERVE
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            to="/simulate"
            className="bg-emerald-600 text-white px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
          >
            Try NERVE
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          className="md:hidden p-1.5 text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-3">
          <Link to="/simulate" onClick={() => setOpen(false)} className="block bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium text-center rounded-lg">
            Try NERVE
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
