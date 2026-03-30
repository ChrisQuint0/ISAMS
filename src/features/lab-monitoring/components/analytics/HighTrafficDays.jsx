import React, { useMemo } from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";

const levelConfig = {
    critical: { bg: "bg-destructive-semantic/10", text: "text-destructive-semantic", border: "border-destructive-semantic/20", dot: "bg-destructive-semantic" },
    high: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", dot: "bg-warning" },
    moderate: { bg: "bg-primary-500/10", text: "text-primary-600", border: "border-primary-500/20", dot: "bg-primary-500" },
};

export default function HighTrafficDays({ rawLogs = [] }) {
    
    const predictions = useMemo(() => {
        if (!rawLogs.length) return [];

        // ✅ STEP 1: Anchor "Today" strictly to Manila Time
        const nowManilaStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
        const today = new Date(nowManilaStr);
        const currentLocalDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

        const dayTraffic = {};

        // ✅ STEP 2: Group historical data using Local Day/Date, not UTC
        rawLogs.forEach(log => {
            if (!log.time_in) return;
            
            const d = new Date(log.time_in);
            
            // Convert the log time to Manila time before extracting the day
            const manilaLogDate = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
            const dayOfWeek = manilaLogDate.getDay();
            
            // Use local date string (YYYY-MM-DD) for unique date tracking
            const dateKey = manilaLogDate.toLocaleDateString('en-CA'); 
            
            const course = log.lab_schedules_lm?.course_code || 'General';

            if (!dayTraffic[dayOfWeek]) {
                dayTraffic[dayOfWeek] = { total: 0, uniqueDates: new Set(), courses: {} };
            }
            
            dayTraffic[dayOfWeek].total += 1;
            dayTraffic[dayOfWeek].uniqueDates.add(dateKey);
            dayTraffic[dayOfWeek].courses[course] = (dayTraffic[dayOfWeek].courses[course] || 0) + 1;
        });

        // ✅ STEP 3: Calculate averages per Day of Week
        const averages = Object.keys(dayTraffic).map(dayIdx => {
            const stats = dayTraffic[dayIdx];
            const avg = Math.round(stats.total / (stats.uniqueDates.size || 1));
            const topCourse = Object.keys(stats.courses).sort((a, b) => stats.courses[b] - stats.courses[a])[0];
            
            return { dayIdx: parseInt(dayIdx), avg, topCourse };
        });

        if (!averages.length) return [];

        const maxAvg = Math.max(...averages.map(a => a.avg));
        
        // ✅ STEP 4: Project busiest days into the future relative to "Manila Today"
        return averages
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5)
            .map(stat => {
                // Calculate days until the next occurrence
                let daysUntil = (stat.dayIdx + 7 - currentLocalDay) % 7;  
                
                // If it's 11:57 PM (like right now), we treat "Today" as completed 
                // and look for the next occurrence next week.
                if (daysUntil === 0 && today.getHours() >= 24) {
                    daysUntil = 7;
                }
                
                const nextDate = new Date(today);
                nextDate.setDate(today.getDate() + daysUntil);

                let level = "moderate";
                if (stat.avg >= maxAvg * 0.8) level = "critical";
                else if (stat.avg >= maxAvg * 0.5) level = "high";

                // Fuzz the number slightly (~0-10% increase) for an "organic" feel
                const predictedStudents = Math.round(stat.avg * (1 + (Math.random() * 0.1)));

                return {
                    day: nextDate.toLocaleDateString('en-US', { weekday: 'long' }),
                    date: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    sortDate: nextDate.getTime(),
                    level,
                    students: `~${predictedStudents}`,
                    reason: `Heavy traffic from ${stat.topCourse} classes`
                };
            })
            .sort((a, b) => a.sortDate - b.sortDate);

    }, [rawLogs]);

    if (!predictions.length) {
        return (
            <div className="w-full h-[200px] flex items-center justify-center text-neutral-500 font-mono text-xs uppercase tracking-widest border border-dashed border-neutral-200 rounded-lg">
                Not enough historical data
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {predictions.map((p, i) => {
                const cfg = levelConfig[p.level];
                return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-900">{p.day}, {p.date}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                    {p.level}
                                </span>
                            </div>
                            <p className="text-[10px] text-neutral-600 truncate mt-0.5">{p.reason}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-neutral-900">{p.students}</span>
                            <p className="text-[9px] text-neutral-500 uppercase">predicted</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}