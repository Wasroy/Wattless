import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Globe from "@/components/Globe";

const HeroSection = () => (
  <section className="min-h-screen flex items-center pt-24 pb-16">
    <div className="container">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — text */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-foreground mb-6">
            Stop overpaying
            <br />
            for{" "}
            <span className="text-emerald-600">GPUs.</span>
          </h1>

          <p className="text-lg text-zinc-400 mb-3 max-w-md">
            You&rsquo;re paying <span className="line-through text-red-500 font-semibold">$3.67/h</span> for an A100.
            We find one at <span className="text-emerald-600 font-semibold">$0.31/h</span>.
          </p>

          <p className="text-sm text-zinc-400 mb-10 max-w-md">
            NERVE hunts across 12 cloud regions for the cheapest Spot GPU,
            launches your job, and if it gets evicted — migrates in 28 seconds.
            You don&rsquo;t lose a single gradient.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/simulate"
              className="bg-emerald-600 text-white px-6 py-3 text-sm font-medium rounded-lg inline-flex items-center gap-2 hover:bg-emerald-700 transition-colors"
            >
              Try it now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/mapmonde"
              className="border border-zinc-200 text-foreground px-6 py-3 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors"
            >
              See live prices
            </Link>
          </div>

          <div className="flex gap-8 mt-12">
            <div>
              <p className="text-2xl font-bold text-foreground">91%</p>
              <p className="text-xs text-zinc-400">cheaper</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">28s</p>
              <p className="text-xs text-zinc-400">to recover</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-zinc-400">data lost</p>
            </div>
          </div>
        </motion.div>

        {/* Right — globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex justify-center lg:justify-end"
        >
          <Link to="/mapmonde" className="group block relative">
            <div className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[460px] lg:h-[460px] transition-transform duration-500 group-hover:scale-[1.03] cursor-pointer">
              <Globe className="w-full h-full" />
            </div>
            <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-100 transition-all duration-500 pointer-events-none">
              <span className="text-sm font-semibold text-foreground bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-full border border-zinc-200 shadow-md transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg">
                Explore the map &rarr;
              </span>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
