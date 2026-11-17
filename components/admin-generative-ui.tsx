"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type {
  SupportTicket,
  Return,
  StockEntry,
  ProductSalesRow,
} from "@/lib/types";
import {
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  RotateCcw,
  Boxes,
  TrendingUp,
  BrainCircuit,
} from "lucide-react";

export function SandboxExecutionCard({
  command,
  stdout,
  stderr,
  exitCode,
  durationMs,
}: {
  command: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  durationMs?: number;
}) {
  const isSuccess = exitCode === 0;

  return (
    <Card className="my-2 overflow-hidden border border-border/80 bg-zinc-950 font-mono text-xs text-zinc-100 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-emerald-400" />
          <span className="font-semibold text-zinc-300">Vercel Sandbox Exec</span>
        </div>
        <div className="flex items-center gap-2">
          {durationMs !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Clock className="size-3" />
              {durationMs}ms
            </span>
          )}
          {isSuccess ? (
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] py-0">
              <CheckCircle2 className="mr-1 size-3" />
              exit 0
            </Badge>
          ) : (
            <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-400 text-[10px] py-0">
              <XCircle className="mr-1 size-3" />
              exit {exitCode ?? 1}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        <div>
          <span className="text-zinc-500 select-none">$ </span>
          <span className="text-emerald-300 font-semibold">{command}</span>
        </div>
        {stdout && (
          <pre className="max-h-48 overflow-x-auto whitespace-pre-wrap rounded bg-black/60 p-2 text-zinc-200">
            {stdout}
          </pre>
        )}
        {stderr && (
          <pre className="max-h-32 overflow-x-auto whitespace-pre-wrap rounded bg-rose-950/40 p-2 text-rose-300">
            {stderr}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

export function SupportTicketsCard({ tickets }: { tickets: SupportTicket[] }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="my-2 rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
        No support tickets found for the selected filters.
      </div>
    );
  }

  return (
    <Card className="my-2 border bg-card">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <Ticket className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold">
            Support Tickets ({tickets.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-60 overflow-y-auto divide-y">
          {tickets.slice(0, 10).map((t) => (
            <div key={t.id} className="p-3 text-xs flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">#{t.id}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{t.category}</Badge>
                  {t.assignee && (
                    <span className="text-[11px] text-muted-foreground">@{t.assignee}</span>
                  )}
                </div>
                <p className="font-medium text-foreground">{t.subject}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{t.customerEmail}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge
                  variant={
                    t.priority === "urgent" || t.priority === "high"
                      ? "destructive"
                      : "secondary"
                  }
                  className="capitalize text-[10px]"
                >
                  {t.priority}
                </Badge>
                <span className="text-[10px] text-muted-foreground capitalize">{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReturnsHistoryCard({ returns }: { returns: Return[] }) {
  if (!returns || returns.length === 0) {
    return (
      <div className="my-2 rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
        No returns found for the selected filters.
      </div>
    );
  }

  return (
    <Card className="my-2 border bg-card">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <RotateCcw className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold">
            Returns History ({returns.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-60 overflow-y-auto divide-y">
          {returns.slice(0, 10).map((r) => (
            <div key={r.id} className="p-3 text-xs flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">#{r.id}</span>
                  <span className="text-muted-foreground">Order: #{r.orderId}</span>
                </div>
                <p className="text-foreground">{r.reason}</p>
                {r.createdAt && (
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge
                  variant={r.decision === "approved" ? "default" : "secondary"}
                  className="capitalize text-[10px]"
                >
                  {r.decision || r.status}
                </Badge>
                {r.refundAmount !== null && r.refundAmount !== undefined && (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(r.refundAmount)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function InventoryStockCard({ stockEntries }: { stockEntries: StockEntry[] }) {
  if (!stockEntries || stockEntries.length === 0) {
    return (
      <div className="my-2 rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
        No inventory stock entries found.
      </div>
    );
  }

  return (
    <Card className="my-2 border bg-card">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <Boxes className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold">
            Inventory Stock ({stockEntries.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-60 overflow-y-auto divide-y">
          {stockEntries.slice(0, 12).map((s) => (
            <div key={s.productId} className="p-3 text-xs flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{s.product?.name || s.productId}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{s.productId}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{s.stock} units</span>
                {s.lowStock && (
                  <Badge variant="destructive" className="text-[10px]">Low Stock</Badge>
                )}
                {!s.inStock && (
                  <Badge variant="secondary" className="text-[10px]">Out of Stock</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesAnalyticsCard({ sales }: { sales: ProductSalesRow[] }) {
  if (!sales || sales.length === 0) {
    return (
      <div className="my-2 rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
        No sales data found for the specified parameters.
      </div>
    );
  }

  const totalRevenue = sales.reduce((acc, row) => acc + (row.revenue || 0), 0);
  const totalUnits = sales.reduce((acc, row) => acc + (row.unitsSold || 0), 0);

  return (
    <Card className="my-2 border bg-card">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold">
            Sales & Revenue Analytics
          </CardTitle>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-primary">
            {formatPrice(totalRevenue)}
          </span>
          <span className="text-[10px] text-muted-foreground ml-1">({totalUnits} units)</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-60 overflow-y-auto divide-y">
          {sales.slice(0, 10).map((row) => (
            <div key={row.productId} className="p-3 text-xs flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{row.product?.name || row.productId}</p>
                <p className="text-[11px] text-muted-foreground">
                  {row.ordersCount} orders • {row.unitsSold} units sold
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{formatPrice(row.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MemoryContextCard({ content, type = "saved" }: { content: string; type?: "saved" | "recalled" }) {
  return (
    <Card className="my-2 border border-violet-500/30 bg-violet-500/5 p-3">
      <div className="flex items-start gap-2.5">
        <BrainCircuit className="size-4 shrink-0 text-violet-500 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-semibold text-foreground">
            {type === "saved" ? "Memory Saved to Sandbox" : "Persistent Memory Active"}
          </h4>
          <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </Card>
  );
}
