"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { formatDate } from "@/lib/utils";
import { 
  CheckSquare, 
  ExternalLink, 
  User, 
  Truck, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter
} from "lucide-react";
import { TaskStatus } from "@demurrageos/shared-types";

export default function TasksPage() {
  const { selectedClientId, isClientScoped } = useClientScope();
  const { data: tasks = [], isLoading } = useTasks(selectedClientId);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredTasks = tasks.filter((t) => {
    return statusFilter === "ALL" || t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Operational Workflows
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Action Tasks & External Handoffs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate container clearances, DO endorsements, and external trucker dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses ({tasks.length})</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Tasks Table / Card List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Task Details</th>
                <th className="py-3.5 px-4">Container</th>
                {!isClientScoped && <th className="py-3.5 px-4">Client</th>}
                <th className="py-3.5 px-4">Assignee & Type</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={isClientScoped ? 6 : 7} className="py-12 text-center text-slate-400">
                    Loading action tasks...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={isClientScoped ? 6 : 7} className="py-12 text-center text-slate-400">
                    No tasks found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isConfirmed = task.status === "CONFIRMED";
                  const isAssigned = task.status === "ASSIGNED";
                  const isExternal = task.assigneeType === "EXTERNAL";

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <Link href={`/tasks/${task.id}`} className="block">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/containers/${task.containerId}`}
                          className="font-mono font-bold text-blue-600 hover:underline"
                        >
                          {task.containerNumber}
                        </Link>
                      </td>

                      {!isClientScoped && (
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-700 truncate max-w-[150px]">
                            {task.clientName}
                          </div>
                        </td>
                      )}

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          {isExternal ? (
                            <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[170px]">
                            {task.assigneeName || "Unassigned"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isExternal ? "External Contact (No Login)" : "Internal Staff"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700">
                          {formatDate(task.dueDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isConfirmed
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isAssigned
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {isConfirmed ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : isAssigned ? (
                            <Clock className="w-3 h-3 text-blue-600" />
                          ) : null}
                          <span>{task.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="p-1.5 inline-flex text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
