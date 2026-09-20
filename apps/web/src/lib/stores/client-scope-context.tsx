"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Client } from "@demurrageos/shared-types";
import { MOCK_CLIENTS } from "@/lib/api/mock-data";

interface ClientScopeContextType {
  selectedClientId: string | "ALL";
  selectedClient: Client | null;
  clients: Client[];
  setSelectedClientId: (id: string | "ALL") => void;
  isClientScoped: boolean;
}

const ClientScopeContext = createContext<ClientScopeContextType | undefined>(undefined);

export function ClientScopeProvider({ children }: { children: React.ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<string | "ALL">("ALL");
  const [clients] = useState<Client[]>(MOCK_CLIENTS);

  const selectedClient = selectedClientId === "ALL" 
    ? null 
    : clients.find(c => c.id === selectedClientId) || null;

  // Persist preference in sessionStorage if available
  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("demurrageos_client_scope") : null;
    if (saved && (saved === "ALL" || clients.some(c => c.id === saved))) {
      setSelectedClientId(saved);
    }
  }, [clients]);

  const handleSetSelectedClientId = (id: string | "ALL") => {
    setSelectedClientId(id);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("demurrageos_client_scope", id);
    }
  };

  return (
    <ClientScopeContext.Provider
      value={{
        selectedClientId,
        selectedClient,
        clients,
        setSelectedClientId: handleSetSelectedClientId,
        isClientScoped: selectedClientId !== "ALL",
      }}
    >
      {children}
    </ClientScopeContext.Provider>
  );
}

export function useClientScope() {
  const context = useContext(ClientScopeContext);
  if (!context) {
    throw new Error("useClientScope must be used within a ClientScopeProvider");
  }
  return context;
}
