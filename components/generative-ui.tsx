"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product, StockInfo, Return, RefundPreauthorization } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, PackageCheck, AlertCircle, ExternalLink } from "lucide-react";

export function ProductSearchResultCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0] || "/placeholder.png";

  return (
    <Card className="overflow-hidden border bg-card transition-all hover:shadow-md">
      <Link href={`/products/${product.slug || product.id}`} className="block group">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 400px) 100vw, 200px"
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
          {product.category && (
            <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
              {product.category}
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h4 className="line-clamp-1 font-medium text-sm group-hover:text-primary transition-colors">
            {product.name}
          </h4>
          <p className="mt-1 font-semibold text-sm">
            {formatPrice(product.price, product.currency)}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}

export function ProductSearchResultsGrid({ products }: { products: Product[] }) {
  if (!products || products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
        No matching products found in the catalog.
      </div>
    );
  }

  return (
    <div className="my-2 grid grid-cols-2 gap-2 sm:grid-cols-2">
      {products.slice(0, 4).map((p) => (
        <ProductSearchResultCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductDetailCard({
  product,
  stock,
}: {
  product: Product;
  stock?: StockInfo | null;
}) {
  const imageUrl = product.images?.[0] || "/placeholder.png";

  return (
    <Card className="my-2 overflow-hidden border bg-card">
      <div className="flex flex-col sm:flex-row gap-3 p-3">
        <div className="relative aspect-square w-24 sm:w-28 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="120px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-base">{product.name}</h4>
              <Badge variant="outline">{product.category}</Badge>
            </div>
            <p className="font-bold text-base mt-1 text-primary">
              {formatPrice(product.price, product.currency)}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {product.description}
            </p>
            {stock && (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-block size-2 rounded-full ${
                    stock.inStock
                      ? stock.lowStock
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />
                <span className="text-xs font-medium">
                  {stock.inStock
                    ? stock.lowStock
                      ? `Low Stock (${stock.stock} left)`
                      : "In Stock"
                    : "Out of Stock"}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <Button asChild size="sm" className="w-full">
              <Link href={`/products/${product.slug || product.id}`}>
                View Product Page
                <ExternalLink className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ReturnConfirmationCard({
  orderId,
  returnRecord,
  refundPreauthorization,
}: {
  orderId: string;
  returnRecord?: Return;
  refundPreauthorization?: RefundPreauthorization;
}) {
  return (
    <Card className="my-2 border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-400">
          <PackageCheck className="size-5" />
        </div>
        <div className="space-y-1 text-sm">
          <h4 className="font-semibold text-foreground">Return Request Filed</h4>
          <p className="text-xs text-muted-foreground">
            Order <span className="font-mono font-medium">#{orderId}</span>
          </p>
          {returnRecord && (
            <p className="text-xs">
              Status: <Badge variant="secondary" className="capitalize">{returnRecord.status}</Badge>
            </p>
          )}
          {refundPreauthorization && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Pre-authorized Refund:{" "}
              {formatPrice(
                refundPreauthorization.amount,
                refundPreauthorization.currency,
              )}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ToolLoadingBadge({ name }: { name: string }) {
  const labelMap: Record<string, string> = {
    searchProducts: "Searching product catalog...",
    getAllCategories: "Fetching store categories...",
    getProductDetails: "Looking up product specs & stock...",
    returnOrder: "Processing order return & refund...",
    getSupportTickets: "Loading support tickets...",
    getReturnsHistory: "Loading returns records...",
    getInventoryStock: "Checking live inventory...",
    getSalesAnalytics: "Calculating sales metrics...",
    bash: "Executing in Vercel Sandbox...",
    saveMemory: "Updating persistent memory...",
    getMemory: "Recalling saved memory...",
  };

  return (
    <div className="my-1.5 flex items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground w-fit">
      <Loader2 className="size-3.5 animate-spin text-primary" />
      <span>{labelMap[name] || `Running ${name}...`}</span>
    </div>
  );
}

export function ToolErrorBadge({
  name,
  error,
}: {
  name: string;
  error?: string;
}) {
  return (
    <div className="my-1.5 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      <span>{error || `Action failed: ${name}`}</span>
    </div>
  );
}
