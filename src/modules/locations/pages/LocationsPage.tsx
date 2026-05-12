import { useState } from "react";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { ITTabs, ITab } from "@app/core/components/ITTabs";
import { FaMapMarkerAlt, FaLayerGroup, FaSyncAlt } from "react-icons/fa";

import { LocationList } from "../components/LocationList";
import { ZoneList } from "../components/ZoneList";
import { RecurringList } from "../components/RecurringList";
import { LOCATIONS_MODULE } from "../locations.constants";

const LocationsPage = () => {
  const [activeTab, setActiveTab] = useState("locations");

  const tabs: ITab[] = [
    {
      id: "locations",
      label: "Puntos de Control",
      icon: FaMapMarkerAlt,
      content: <LocationList />,
    },
    {
      id: "zones",
      label: "Zonas",
      icon: FaLayerGroup,
      content: <ZoneList />,
    },
    {
      id: "recurring",
      label: "Recurrentes",
      icon: FaSyncAlt,
      content: <RecurringList />,
    },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <ModuleHeader {...LOCATIONS_MODULE} />
      
      <div className="mt-4">
        <ITTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      </div>
    </div>
  );
};

export default LocationsPage;
