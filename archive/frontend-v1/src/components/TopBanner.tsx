const items = [
  "Your GPU bill is 10x too high",
  "A100 Spot from $0.31/h — not $3.67",
  "Evicted? Back in 28s, nothing lost",
  "Same model. 89% less carbon.",
];

const TopBanner = () => (
  <div className="fixed top-0 z-[60] w-full bg-emerald-600 overflow-hidden">
    <div className="flex h-7 items-center whitespace-nowrap">
      <div className="animate-marquee flex shrink-0">
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span key={i} className="mx-10 text-[11px] text-white/90 font-medium tracking-wide">
            {item}
          </span>
        ))}
      </div>
    </div>
  </div>
);

export default TopBanner;
