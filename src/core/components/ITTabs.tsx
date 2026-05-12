import { ReactNode } from "react";

export interface ITab {
  id: string;
  label: string;
  icon?: React.ElementType;
  content: ReactNode;
}

interface ITTabsProps {
  tabs: ITab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const ITTabs = ({ tabs, activeTab, onChange }: ITTabsProps) => {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-1 border-b border-slate-100 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap
                ${isActive 
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50/30" 
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }
              `}
            >
              {Icon && <Icon size={16} />}
              <span className="uppercase tracking-wider text-[11px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="flex-1">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};
