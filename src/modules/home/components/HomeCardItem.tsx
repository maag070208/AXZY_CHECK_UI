import { ITCard } from "@axzydev/axzy_ui_system";

export const HomeCardItem = ({ item, index }: any) => {
  const colors = [
    { bg: "bg-emerald-500", shadow: "shadow-emerald-200" },
    { bg: "bg-blue-500", shadow: "shadow-blue-200" },
    { bg: "bg-indigo-500", shadow: "shadow-indigo-200" },
    { bg: "bg-violet-500", shadow: "shadow-violet-200" },
    { bg: "bg-orange-500", shadow: "shadow-orange-200" },
    { bg: "bg-rose-500", shadow: "shadow-rose-200" },
    { bg: "bg-cyan-500", shadow: "shadow-cyan-200" },
    { bg: "bg-teal-500", shadow: "shadow-teal-200" },
    { bg: "bg-purple-500", shadow: "shadow-purple-200" },
  ];
  const color = colors[index % colors.length];

  return (
    <ITCard
      onClick={item.action}
      className="bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl cursor-pointer"
      contentClassName="h-full flex items-center p-5"
      key={index}
    >
      <div className="flex items-center gap-4 w-full">
        <div className={`${color.bg} rounded-xl p-3 flex items-center justify-center flex-shrink-0 w-12 h-12 shadow-sm`}>
          {item.icon && <div className="text-lg">{item.icon}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-700">{item.title}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{item.description}</p>
        </div>
      </div>
    </ITCard>
  );
};
