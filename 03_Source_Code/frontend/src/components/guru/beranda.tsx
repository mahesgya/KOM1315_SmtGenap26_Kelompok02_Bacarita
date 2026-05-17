
export const StatCard = ({ icon: Icon, title, value }: { icon: React.ReactNode; title: string; value: number | string }) => (
  <div className="bg-[#Fff8ec] border-2 border-[#DE954F] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#5a4631] text-[12px] font-medium">{title}</p>
        <p className="text-[#5a4631] text-xl font-bold mt-2">{value}</p>
      </div>
      <div className="text-[#DE954F] opacity-70">{Icon}</div>
    </div>
  </div>
);

export const MedalBadge = ({ medal }: { medal: string }) => {
  const medalConfig: Record<string, { image: string; label: string }> = {
    GOLD: { image: "/assets/medals/gold_medal.svg", label: "GOLD" },
    SILVER: { image: "/assets/medals/silver_medal.svg", label: "SILVER" },
    BRONZE: { image: "/assets/medals/bronze_medal.svg", label: "BRONZE" },
  };

  const config = medalConfig[medal] || medalConfig.BRONZE;

  return (
    <span className="flex items-center gap-2 bg-[#Fff8ec] rounded-full px-3 py-1 text-sm font-semibold">
      <img src={config.image} alt={config.label} className="w-5 h-5" />
      <span className="text-[#5a4631]">{config.label}</span>
    </span>
  );
};