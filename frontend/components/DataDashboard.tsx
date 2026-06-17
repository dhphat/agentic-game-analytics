"use client";

import { SQLViewer } from "./SQLViewer";
import { DataTable } from "./DataTable";
import { AnalyticsChart } from "./AnalyticsChart";
import { AIInsightBox } from "./AIInsightBox";

export interface DataPayload {
  sql: string;
  data: any[];
  chartConfig?: {
    type: "bar" | "line" | "pie" | "area" | "scatter" | "radar";
    xKey: string;
    yKey: string;
  };
  insight: string;
  suggestedQuestions?: string[];
  action?: {
    label: string;
    actionType: string;
    targetUserIds: string[];
  };
}

export function DataDashboard({ payload }: { payload: DataPayload }) {
  return (
    <div className="w-full flex flex-col gap-2 mt-2">
      <SQLViewer sql={payload.sql} />
      
      {payload.data && payload.data.length > 0 && (
        <DataTable data={payload.data} />
      )}
      
      {payload.chartConfig && payload.data && payload.data.length > 0 && (
        <AnalyticsChart 
          data={payload.data} 
          type={payload.chartConfig.type} 
          xKey={payload.chartConfig.xKey} 
          yKey={payload.chartConfig.yKey} 
        />
      )}
      
      {payload.insight && (
        <AIInsightBox insight={payload.insight} action={payload.action} />
      )}
    </div>
  );
}
