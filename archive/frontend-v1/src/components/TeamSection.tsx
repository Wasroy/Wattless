import { motion } from "framer-motion";
import { Github } from "lucide-react";

const team = [
  { name: "Nicolas", role: "Backend & Infra", description: "The one who makes GPUs obey. API, orchestration, carbon pipeline.", avatar: "N" },
  { name: "William", role: "Frontend & Design", description: "The one who makes it look good. Dashboard, globe, data viz.", avatar: "W" },
];

const TeamSection = () => (
  <section className="py-24">
    <div className="container text-center">
      <p className="text-xs font-medium text-emerald-600 tracking-widest uppercase mb-3">
        Team
      </p>
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
        Two people. 48 hours.
      </h2>
      <p className="text-zinc-400 text-sm mb-14">
        Europe Hack 2026
      </p>

      <div className="flex justify-center gap-8 mb-10">
        {team.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-emerald-600">{member.avatar}</span>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-0.5">{member.name}</h3>
            <p className="font-mono text-[11px] text-emerald-600 mb-2">{member.role}</p>
            <p className="text-zinc-400 text-xs max-w-[200px]">{member.description}</p>
          </motion.div>
        ))}
      </div>

      <a
        href="https://github.com/Nick0-ai"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-foreground transition-colors"
      >
        <Github className="h-4 w-4" />
        github.com/Nick0-ai
      </a>
    </div>
  </section>
);

export default TeamSection;
