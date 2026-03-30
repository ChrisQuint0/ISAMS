import React from "react";
import { Monitor, Laptop, AlertTriangle, Check } from "lucide-react";

// GSDS Color Tokens
const GSDS_COLORS = {
    // Primary - Green School Green
    primary500: '#008A45',
    primary600: '#006B35',
    primary700: '#004D26',
    // Secondary - Green School Gold
    gold400: '#FFD700',
    gold500: '#FFCE00',
    gold600: '#E6B800',
    // Neutral
    neutral50: '#f9fafb',
    neutral100: '#f3f4f6',
    neutral200: '#e5e7eb',
    neutral500: '#6b7280',
    neutral900: '#111827',
    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    destructive: '#ef4444',
    info: '#3b82f6'
};

// Status styling using GSDS tokens
const STATUS_STYLES = {
    Occupied: {
        bg: `rgba(0, 138, 69, 0.08)`,
        border: `rgba(0, 138, 69, 0.25)`,
        borderHover: `rgba(0, 138, 69, 0.35)`,
        iconColor: GSDS_COLORS.primary500,
        textColor: GSDS_COLORS.primary500,
        shadow: '0 0 15px rgba(0, 138, 69, 0.1)'
    },
    Laptop: {
        bg: `rgba(255, 215, 0, 0.08)`,
        border: `rgba(255, 215, 0, 0.25)`,
        borderHover: `rgba(255, 215, 0, 0.35)`,
        iconColor: GSDS_COLORS.gold400,
        textColor: GSDS_COLORS.gold400,
        shadow: 'none'
    },
    Maintenance: {
        bg: `rgba(245, 158, 11, 0.1)`,
        border: `rgba(245, 158, 11, 0.4)`,
        borderHover: `rgba(245, 158, 11, 0.5)`,
        iconColor: GSDS_COLORS.warning,
        textColor: GSDS_COLORS.warning,
        shadow: '0 0 15px rgba(245, 158, 11, 0.2)'
    },
    Available: {
        bg: `rgba(107, 114, 128, 0.05)`,
        border: `rgba(107, 114, 128, 0.2)`,
        borderHover: `rgba(107, 114, 128, 0.3)`,
        iconColor: GSDS_COLORS.neutral500,
        textColor: GSDS_COLORS.neutral500,
        shadow: 'none'
    }
};

const getStationStyles = (status, isSelected, isChecked) => {
    const baseStyle = STATUS_STYLES[status] || STATUS_STYLES.Available;
    const opacity = status === 'Available' ? 0.7 : 1;

    return {
        backgroundColor: isChecked ? `rgba(0, 138, 69, 0.12)` : baseStyle.bg,
        borderColor: isChecked ? GSDS_COLORS.primary500 : baseStyle.border,
        borderWidth: '1px',
        opacity: opacity,
        boxShadow: baseStyle.shadow
    };
};

const getCheckboxStyles = (isChecked) => ({
    backgroundColor: isChecked ? GSDS_COLORS.primary500 : `rgba(107, 114, 128, 0.1)`,
    borderColor: isChecked ? GSDS_COLORS.primary600 : GSDS_COLORS.neutral200,
    borderWidth: '1px'
});

export default function PCGridLayout({ stations, selectedPC, onSelectPC, selectMode = false, checkedPCs = [], onToggleCheck }) {
    const renderStationButton = (station) => {
        const isChecked = checkedPCs.includes(station.id);
        const isSelected = selectedPC?.id === station.id && !selectMode;
        const stationStyle = getStationStyles(station.status, isSelected, isChecked);

        return (
            <button
                key={station.id}
                onClick={() => selectMode ? onToggleCheck(station.id) : onSelectPC(station)}
                style={stationStyle}
                className="aspect-square rounded-xl border flex flex-col items-center justify-center p-2 transition-all duration-300 relative group hover:scale-105"
            >
                {/* Checkbox overlay in select mode */}
                {selectMode && (
                    <div
                        style={getCheckboxStyles(isChecked)}
                        className="absolute top-1 left-1 w-4 h-4 rounded border flex items-center justify-center transition-all z-20"
                    >
                        {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                )}

                {/* Station icon */}
                <div className="mb-1">
                    {station.status === 'Laptop' ? (
                        <Laptop size={24} style={{ color: STATUS_STYLES[station.status]?.iconColor }} />
                    ) : (
                        <Monitor size={24} style={{ color: STATUS_STYLES[station.status]?.iconColor }} />
                    )}
                </div>

                {/* Station ID label */}
                <span
                    className="text-[10px] font-black tracking-widest"
                    style={{ color: STATUS_STYLES[station.status]?.textColor }}
                >
                    {station.id}
                </span>

                {/* Maintenance warning badge */}
                {station.status === 'Maintenance' && (
                    <div className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full shadow-lg" style={{ backgroundColor: GSDS_COLORS.warning }}>
                        <AlertTriangle size={12} fill={GSDS_COLORS.neutral900} color={GSDS_COLORS.neutral900} />
                    </div>
                )}

                {/* Selection ring */}
                {isSelected && (
                    <div className="absolute inset-0 rounded-xl ring-2" style={{ ringColor: GSDS_COLORS.primary500 }} />
                )}
                {isChecked && (
                    <div className="absolute inset-0 rounded-xl ring-2" style={{ ringColor: GSDS_COLORS.primary500 }} />
                )}
            </button>
        );
    };

    return (
        <div className="bg-white border rounded-2xl p-8 shadow-lg relative overflow-hidden group transition-colors" style={{ borderColor: GSDS_COLORS.neutral200 }}>
            <div className="mb-3 py-0.5 px-8 rounded-md border text-center mx-auto" style={{ backgroundColor: '#fafafa', width: '300px' }}>
                <p className="text-[8px] font-medium uppercase tracking-widest text-neutral-500">
                    Whiteboard
                </p>
            </div>

            <div className="grid grid-cols-5 md:grid-cols-8 gap-4 max-w-5xl mx-auto">
                {stations.map(renderStationButton)}
            </div>
        </div>
    );
}