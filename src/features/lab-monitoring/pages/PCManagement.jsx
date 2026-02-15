import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

// Import components
import PCGridLayout from "../layouts/PCGridLayout"; 
import StationInspector from "../components/pc-management/StationInspector";

export default function PCManagement() {
    const { labName } = useOutletContext();
    
    // State to track which PC the admin clicked on the map
    const [selectedPC, setSelectedPC] = useState(null);

    // Dummy Data State (To be replaced with Supabase real-time data later)
    const [stations] = useState(Array.from({ length: 40 }, (_, i) => {
        const num = i + 1;
        const id = `PC-${num.toString().padStart(2, '0')}`;
        
        // Simulating statuses
        if (num === 12 || num === 28) return { id, status: "Maintenance", user: null, hours: 505 };
        if (num === 5 || num === 14) return { id, status: "Laptop", user: "Student", hours: 120 };
        if (num % 3 === 0) return { id, status: "Available", user: null, hours: 250 };
        return { id, status: "Occupied", user: "Student", hours: 340 };
    }));

    return (
        <div className="p-8 space-y-6 bg-[#020617] min-h-screen text-slate-100 flex flex-col lg:flex-row gap-6">
            
            {/* LEFT SIDE: The Visual Map */}
            <div className="flex-1 space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{labName} — Station Map</h1>
                        <p className="text-slate-400 text-sm italic">Visual Capacity & Hardware Management</p>
                    </div>
                    
                    {/* Map Legend */}
                    <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest bg-[#0f172a] p-3 rounded-lg border border-[#1e293b]">
                        <span className="flex items-center gap-1.5 text-sky-500">
                            <div className="w-2 h-2 rounded-full bg-sky-500"></div> Occupied
                        </span>
                        <span className="flex items-center gap-1.5 text-purple-500">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div> Laptop
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-slate-600"></div> Available
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-500">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div> Alert
                        </span>
                    </div>
                </div>

                {/* PC Grid Layout Component */}
                <PCGridLayout 
                    stations={stations} 
                    selectedPC={selectedPC} 
                    onSelectPC={setSelectedPC} 
                />
            </div>

            {/* RIGHT SIDE: Station Inspector Panel */}
            <div className="w-full lg:w-80 space-y-6">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 h-full shadow-2xl flex flex-col">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
                        Station Inspector
                    </h3>
                    
                    {/* Station Inspector Component */}
                    <StationInspector selectedPC={selectedPC} />
                </div>
            </div>
            
        </div>
    );
}