import React from "react";
import { ContainerEvent } from "@demurrageos/shared-types";
import { formatDate } from "@/lib/utils";
import { 
  ArrowRightLeft, 
  Anchor, 
  FileCheck, 
  Truck, 
  Building, 
  FileText, 
  AlertCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventTimelineProps {
  events: ContainerEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  // Sort latest first
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case "CONTAINER_DISCHARGED":
        return <Anchor className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "DPD_TO_CFS_FALLBACK":
        return <ArrowRightLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "CUSTOMS_OUT_OF_CHARGE":
      case "DELIVERY_ORDER_ISSUED":
        return <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "CUSTOMS_EXAM_ORDERED":
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case "CFS_GATE_IN":
      case "CFS_GATE_OUT":
        return <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "CONTAINER_PICKUP_SCHEDULED":
      case "CONTAINER_GATE_OUT":
        return <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0c1424] rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Operational Milestone Timeline</h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">{events.length} recorded events</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
        {sortedEvents.map((evt) => {
          const isFallback = evt.eventType === "DPD_TO_CFS_FALLBACK";

          return (
            <div key={evt.id} className="relative group">
              {/* Timeline marker node */}
              <div
                className={cn(
                  "absolute -left-6 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                  isFallback
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 animate-bounce"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0c1424]"
                )}
              >
                {getEventIcon(evt.eventType)}
              </div>

              {/* Event card */}
              <div
                className={cn(
                  "rounded-lg p-3 border transition-colors",
                  isFallback
                    ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/40 ring-1 ring-amber-400/20 shadow-sm"
                    : "bg-slate-50/60 dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isFallback ? "text-amber-900 dark:text-amber-300 flex items-center gap-1.5" : "text-slate-800 dark:text-slate-200"
                    )}
                  >
                    {evt.eventType.replace(/_/g, " ")}
                    {isFallback && (
                      <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 px-1.5 py-0.2 rounded font-extrabold">
                        CRITICAL TURNING POINT
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formatDate(evt.timestamp)}
                  </span>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">{evt.description}</div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 mt-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <span>
                    Location: <strong className="text-slate-700 dark:text-slate-300">{evt.location}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Source: <strong className="text-slate-700 dark:text-slate-300">{evt.source.replace(/_/g, " ")}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
