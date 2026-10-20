import { ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";

export const HomeCardItem = ({ item, index }: any) => {
  return (
    <ITCard
      onClick={item.action}
      className="bg-gray-200 border-gray-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg"
      contentClassName="h-full flex items-center hover:bg-gray-100 cursor-pointer p-6 min-h-[80px]"
      key={index}
    >
      <ITFlex align="center" className="flex items-center space-x-4 w-full">
        {/* Primary Color circular icon container */}
        <ITFlex align="center" justify="center" className="bg-[#065911] rounded-full p-3 flex items-center justify-center flex-shrink-0 w-12 h-12">
          {item.icon && <ITFlex direction="column" className="text-2xl">{item.icon}</ITFlex>}
        </ITFlex>
        {/* Cyan text for module name to match sidebar */}
        <ITText as="p" className="text-xl font-medium text-black-400 flex-1">{item.title}</ITText>
      </ITFlex>
    </ITCard>
  );
};
