import { 
  Container, 
  DashboardMetrics, 
  Task, 
  DocumentRecord, 
  ExternalTaskConfirmationPayload 
} from "@demurrageos/shared-types";
import { 
  MOCK_CONTAINERS, 
  MOCK_TASKS, 
  MOCK_DOCUMENTS, 
  getMockDashboardMetrics 
} from "./mock-data";

// In-memory mutable state for dynamic demo interactions (like confirming tasks, fallback, etc.)
let containersState = [...MOCK_CONTAINERS];
let tasksState = [...MOCK_TASKS];
let documentsState = [...MOCK_DOCUMENTS];

export const apiClient = {
  // Metrics
  async getDashboardMetrics(clientId: string | "ALL" = "ALL"): Promise<DashboardMetrics> {
    await delay(150);
    return getMockDashboardMetrics(clientId);
  },

  // Containers
  async getContainers(clientId?: string | "ALL"): Promise<Container[]> {
    await delay(200);
    if (!clientId || clientId === "ALL") {
      return [...containersState];
    }
    return containersState.filter(c => c.clientId === clientId);
  },

  async getContainerById(id: string): Promise<Container | null> {
    await delay(150);
    const found = containersState.find(c => c.id === id);
    return found ? { ...found } : null;
  },

  // Trigger demo DPD to CFS fallback
  async triggerDpdFallback(containerId: string): Promise<Container> {
    await delay(300);
    const index = containersState.findIndex(c => c.id === containerId);
    if (index === -1) throw new Error("Container not found");

    const container = containersState[index];
    const updated: Container = {
      ...container,
      deliveryMode: "CFS",
      status: "CRITICAL",
      twoClocks: {
        hasFallback: true,
        carrierClock: container.twoClocks.carrierClock,
        cfsClock: {
          basis: "CFS Ground Rent (Speedy CFS)",
          startDate: new Date().toISOString(),
          freeDaysTotal: 3,
          freeDaysRemaining: 0,
          daysOverdue: 1,
          isActive: true,
          expiryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        },
      },
      currentExposureINR: container.currentExposureINR + 25000,
      events: [
        {
          id: `evt_fallback_${Date.now()}`,
          containerId: container.id,
          eventType: "DPD_TO_CFS_FALLBACK",
          timestamp: new Date().toISOString(),
          location: `${container.portOfDischarge} Transfer Gate`,
          source: "MANUAL_ENTRY",
          description: "DPD direct clearance window lapsed. Cargo routed to CFS. Dual-clock ground rent activated.",
        },
        ...container.events,
      ],
    };

    containersState[index] = updated;
    return updated;
  },

  // Tasks
  async getTasks(clientId?: string | "ALL"): Promise<Task[]> {
    await delay(150);
    if (!clientId || clientId === "ALL") {
      return [...tasksState];
    }
    return tasksState.filter(t => t.clientId === clientId);
  },

  async getTaskById(taskId: string): Promise<Task | null> {
    await delay(150);
    const task = tasksState.find(t => t.id === taskId);
    return task ? { ...task } : null;
  },

  async assignExternalTask(params: {
    taskId: string;
    assigneeName: string;
    assigneeContact: string;
  }): Promise<Task> {
    await delay(250);
    const index = tasksState.findIndex(t => t.id === params.taskId);
    if (index === -1) throw new Error("Task not found");

    const token = `tok_ext_${Math.random().toString(36).substring(2, 11)}`;
    const expiry = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

    const updated: Task = {
      ...tasksState[index],
      status: "ASSIGNED",
      assigneeType: "EXTERNAL",
      assigneeName: params.assigneeName,
      assigneeContact: params.assigneeContact,
      externalToken: token,
      tokenExpiry: expiry,
    };

    tasksState[index] = updated;
    return updated;
  },

  async getTaskByToken(token: string): Promise<Task | null> {
    await delay(150);
    const task = tasksState.find(t => t.externalToken === token);
    return task ? { ...task } : null;
  },

  async confirmExternalTask(payload: ExternalTaskConfirmationPayload): Promise<Task> {
    await delay(300);
    const index = tasksState.findIndex(t => t.externalToken === payload.token);
    if (index === -1) throw new Error("Invalid or expired token");

    const task = tasksState[index];
    const confirmedTime = new Date().toISOString();

    const updatedTask: Task = {
      ...task,
      status: "CONFIRMED",
      confirmedAt: confirmedTime,
      description: `${task.description}\n\n[Confirmed by Transporter: ${payload.transporterName}, Vehicle: ${payload.vehicleNumber}, Pickup Time: ${payload.scheduledPickupTime}]`,
    };
    tasksState[index] = updatedTask;

    // Also update container event
    const containerIdx = containersState.findIndex(c => c.id === task.containerId);
    if (containerIdx !== -1) {
      const container = containersState[containerIdx];
      containersState[containerIdx] = {
        ...container,
        events: [
          {
            id: `evt_conf_${Date.now()}`,
            containerId: container.id,
            eventType: "CONTAINER_PICKUP_SCHEDULED",
            timestamp: confirmedTime,
            location: "External Transporter Portal",
            source: "EXTERNAL_CONFIRMATION",
            description: `Transporter ${payload.transporterName} confirmed pickup appointment for ${payload.scheduledPickupTime}. Vehicle: ${payload.vehicleNumber}.`,
          },
          ...container.events,
        ],
      };
    }

    return updatedTask;
  },

  // Documents
  async getDocuments(containerId: string): Promise<DocumentRecord[]> {
    await delay(150);
    return documentsState.filter(d => d.containerId === containerId);
  },

  async updateDocumentField(params: {
    documentId: string;
    fieldKey: string;
    newValue: string | number;
  }): Promise<DocumentRecord> {
    await delay(200);
    const docIdx = documentsState.findIndex(d => d.id === params.documentId);
    if (docIdx === -1) throw new Error("Document not found");

    const doc = documentsState[docIdx];
    const updatedField = {
      ...doc.extractedFields[params.fieldKey],
      value: params.newValue,
      flaggedForReview: false,
    };

    const updatedDoc: DocumentRecord = {
      ...doc,
      extractedFields: {
        ...doc.extractedFields,
        [params.fieldKey]: updatedField,
      },
    };

    documentsState[docIdx] = updatedDoc;
    return updatedDoc;
  },

  async acceptDocument(documentId: string): Promise<DocumentRecord> {
    await delay(250);
    const docIdx = documentsState.findIndex(d => d.id === documentId);
    if (docIdx === -1) throw new Error("Document not found");

    const updatedDoc: DocumentRecord = {
      ...documentsState[docIdx],
      status: "REVIEWED",
    };
    documentsState[docIdx] = updatedDoc;
    return updatedDoc;
  }
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
