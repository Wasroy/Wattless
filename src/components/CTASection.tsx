import { motion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-24">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-emerald-600 rounded-3xl px-8 py-16 md:py-20 md:px-16 text-center max-w-4xl mx-auto"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Your next training run
          <br />
          shouldn&rsquo;t cost $88.
        </h2>
        <p className="text-emerald-100 text-sm mb-10 max-w-md mx-auto">
          12 regions. Real-time Spot prices. One command. Try it — it&rsquo;s open source.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/dashboard"
            className="bg-white text-emerald-700 px-7 py-3 text-sm font-semibold rounded-lg inline-flex items-center gap-2 hover:bg-emerald-50 transition-colors"
          >
            See the dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/Nick0-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/30 text-white px-7 py-3 text-sm font-medium rounded-lg inline-flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>

        <p className="text-emerald-200/50 text-[10px] mt-10 tracking-wide">
          Built at Europe Hack 2026 &mdash; Open source
        </p>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
