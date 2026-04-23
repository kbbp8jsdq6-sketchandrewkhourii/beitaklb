const ITEMS = [
  "🏠 500+ Customers Served",
  "🏡 400+ Listings Available",
  "📍 Covering All Areas in Lebanon",
  "✅ 0% Service Fees",
];

function LoopContent() {
  return (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {ITEMS.map((item, i) => (
        <span key={i} className="flex items-center gap-6 whitespace-nowrap">
          <span>{item}</span>
          <span aria-hidden className="text-white/80">⬥</span>
        </span>
      ))}
    </div>
  );
}

export function AnnouncementBar() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: "#CC0000" }}
      role="region"
      aria-label="Announcements"
    >
      <div className="flex py-3 text-sm font-bold leading-relaxed tracking-wide text-white announcement-track">
        {/* Two copies for seamless loop */}
        <LoopContent />
        <LoopContent />
      </div>
    </div>
  );
}
