"use client";

import React, { useState, useRef, useEffect } from "react";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { ChevronDown, Check, Building2, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClientSwitcher() {
  const { selectedClientId, setSelectedClientId, clients } = useClientScope();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedClient =
    selectedClientId === "ALL"
      ? null
      : clients.find((c) => c.id === selectedClientId);

  const totalActiveContainers = clients.reduce(
    (sum, c) => sum + c.activeContainersCount,
    0
  );
  const totalCritical = clients.reduce(
    (sum, c) => sum + c.criticalRiskCount,
    0
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
      >
        <div className="w-6 h-6 rounded flex items-center justify-center text-amber-700 dark:text-amber-400 bg-amber-500/10 shrink-0">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="text-left max-w-[180px]">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold leading-none">
            Client Scope
          </div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5 truncate">
            {selectedClient ? (
              <>
                <span className="truncate">{selectedClient.name}</span>
                {selectedClient.aeoStatus !== "NONE" && (
                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 flex items-center gap-0.5 shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {selectedClient.aeoStatus}
                  </span>
                )}
              </>
            ) : (
              <span className="text-amber-700 dark:text-amber-400">
                All Clients ({clients.length} Rollup)
              </span>
            )}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 ml-0.5 shrink-0" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-xl py-1.5 z-50 animate-in fade-in-0 zoom-in-95 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Switch Operating Client
          </div>

          {/* All Clients */}
          <button
            onClick={() => {
              setSelectedClientId("ALL");
              setIsOpen(false);
            }}
            className={cn(
              "w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition-colors cursor-pointer",
              selectedClientId === "ALL"
                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 font-bold text-[10px] flex items-center justify-center">
                ALL
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  All Clients Rollup
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {totalActiveContainers} containers •{" "}
                  {totalCritical > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      {totalCritical} critical at risk
                    </span>
                  ) : (
                    "0 critical"
                  )}
                </div>
              </div>
            </div>
            {selectedClientId === "ALL" && (
              <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-white/5" />

          {/* Client List */}
          <div className="max-h-64 overflow-y-auto">
            {clients.map((client) => {
              const isSelected = selectedClientId === client.id;
              return (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors cursor-pointer",
                    isSelected
                      ? "bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 font-semibold text-[10px] flex items-center justify-center">
                      {client.code.substring(0, 3)}
                    </div>
                    <div>
                      <div className="font-medium text-xs truncate max-w-[190px] text-slate-800 dark:text-white">
                        {client.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>{client.activeContainersCount} containers</span>
                        {client.criticalRiskCount > 0 && (
                          <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3 inline" />
                            {client.criticalRiskCount} critical
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
