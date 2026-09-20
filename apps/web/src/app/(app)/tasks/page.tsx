"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { formatDate } from "@/lib/utils";
import {
  CheckSquare,
  User,
  Truck,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { TaskStatus } from "@demurrageos/shared-types";
import { SkeletonRow } from "@/components/ui/skeleton";

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
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
            Operational Workflows
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Action Tasks &amp; External Handoffs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Coordinate container clearances, DO endorsements, and external trucker dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-xs font-medium focus:outline-none cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-sm"
          >
            <option value="ALL">All Statuses ({tasks.length})</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-xl overflow-hidden bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                <th className="py-3.5 px-4">Task Details</th>
                <th className="py-3.5 px-4">Container</th>
                {!isClientScoped && <th className="py-3.5 px-4">Client</th>}
                <th className="py-3.5 px-4">Assignee &amp; Type</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={isClientScoped ? 6 : 7} className="p-0">
                    <div className="space-y-0">
                      {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={isClientScoped ? 6 : 7}
                    className="py-12 text-center text-slate-500 dark:text-slate-400"
                  >
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
                      className="transition-colors duration-150 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <td className="py-3.5 px-4">
                        <Link href={`/tasks/${task.id}`} className="block">
                          <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/containers/${task.containerId}`}
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          {task.containerNumber}
                        </Link>
                      </td>

                      {!isClientScoped && (
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                            {task.clientName}
                          </div>
                        </td>
                      )}

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          {isExternal ? (
                            <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[170px]">
                            {task.assigneeName || "Unassigned"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {isExternal ? "External Contact (No Login)" : "Internal Staff"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {formatDate(task.dueDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isConfirmed
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                              : isAssigned
                              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {isConfirmed ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : isAssigned ? (
                            <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          ) : null}
                          <span>{task.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="p-1.5 inline-flex rounded transition-colors text-slate-400 hover:text-amber-600 dark:text-slate-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/5"
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
