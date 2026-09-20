"use client";

import React, { useState, useRef, useEffect } from "react";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { ChevronDown, Check, Building2, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClientSwitcher() {
  const { selectedClientId, setSelectedClientId, clients } = useClientScope();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedClient = selectedClientId === "ALL" 
    ? null 
    : clients.find(c => c.id === selectedClientId);

  const totalActiveContainers = clients.reduce((sum, c) => sum + c.activeContainersCount, 0);
  const totalCritical = clients.reduce((sum, c) => sum + c.criticalRiskCount, 0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-600">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
            Client Scope
          </div>
          <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
            {selectedClient ? (
              <>
                <span className="truncate max-w-[170px]">{selectedClient.name}</span>
                {selectedClient.aeoStatus !== "NONE" && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {selectedClient.aeoStatus}
                  </span>
                )}
              </>
            ) : (
              <span className="font-semibold text-blue-700">All Clients ({clients.length} Rollup)</span>
            )}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-80 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-0 zoom-in-95">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Switch Operating Client
          </div>

          {/* All Clients Option */}
          <button
            onClick={() => {
              setSelectedClientId("ALL");
              setIsOpen(false);
            }}
            className={cn(
              "w-full text-left px-3 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors",
              selectedClientId === "ALL" && "bg-blue-50/70 text-blue-900 font-medium"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                ALL
              </div>
              <div>
                <div className="text-slate-800 font-semibold text-sm">All Clients Rollup</div>
                <div className="text-xs text-slate-500">
                  {totalActiveContainers} containers • {totalCritical > 0 ? (
                    <span className="text-rose-600 font-medium">{totalCritical} critical at risk</span>
                  ) : "0 critical"}
                </div>
              </div>
            </div>
            {selectedClientId === "ALL" && <Check className="w-4 h-4 text-blue-600" />}
          </button>

          <div className="my-1 border-t border-slate-100" />

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
                    "w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors",
                    isSelected && "bg-blue-50/70 text-blue-900 font-medium"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-xs border border-slate-200">
                      {client.code.substring(0, 3)}
                    </div>
                    <div>
                      <div className="text-slate-800 font-medium text-xs truncate max-w-[190px]">
                        {client.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span>{client.activeContainersCount} containers</span>
                        {client.criticalRiskCount > 0 && (
                          <span className="text-rose-600 font-medium flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3 inline" />
                            {client.criticalRiskCount} critical
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
