import { type FC, memo } from "react";

type StatCardProps = {
  value: string | number;
  label: string;
};
const StatCard: FC<StatCardProps> = ({ value, label }) => (
  <div className="verdana rounded-2xl bg-[#Fff8ec] border border-[#DE954F] shadow-sm px-5 py-4">
    <div className="text-3xl md:text-4xl font-extrabold text-[#513723]">{value}</div>
    <div className="text-[#513723]/80 mt-1 text-sm md:text-base">{label}</div>
  </div>
);
export default memo(StatCard);
