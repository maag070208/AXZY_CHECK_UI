import { useState } from 'react';
import { FaTags } from 'react-icons/fa';
import { CATALOG_TABS } from '../constants/catalogs.constants';
import CatalogTabContent from '../components/CatalogTabContent';

const CatalogsPage = () => {
    const [activeTab, setActiveTab] = useState<'INCIDENT' | 'MAINTENANCE' | 'CASA_CLUB'>('INCIDENT');

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <FaTags className="text-emerald-600" />
                        Catálogos
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Administra las categorías y tipos que el guardia selecciona al reportar.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
                <div className="flex border-b border-slate-100">
                    {CATALOG_TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors border-b-2 ${isActive
                                    ? 'border-emerald-500 text-emerald-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                            >
                                <Icon />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <CatalogTabContent type={activeTab} />
        </div>
    );
};

export default CatalogsPage;
