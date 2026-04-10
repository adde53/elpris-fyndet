import { useElpriser, type ZoneResult } from "@/hooks/useElpriser";
import { PriceCard } from "@/components/PriceCard";
import { Zap, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getTiers(zones: ZoneResult[]): Record<string, "cheap" | "mid" | "expensive"> {
  const withPrices = zones.filter((z) => z.cheapestHour);
  if (!withPrices.length) return {};

  const sorted = [...withPrices].sort(
    (a, b) => (a.cheapestHour?.priceOreKwh ?? Infinity) - (b.cheapestHour?.priceOreKwh ?? Infinity)
  );

  const tiers: Record<string, "cheap" | "mid" | "expensive"> = {};
  sorted.forEach((z, i) => {
    if (i === 0) tiers[z.zone] = "cheap";
    else if (i === sorted.length - 1 && sorted.length > 2) tiers[z.zone] = "expensive";
    else tiers[z.zone] = "mid";
  });
  return tiers;
}

export default function Index() {
  const { data: zones, isLoading, error, dataUpdatedAt } = useElpriser();

  const tiers = zones ? getTiers(zones) : {};
  const cheapestZone = zones
    ?.filter((z) => z.cheapestHour)
    .sort((a, b) => (a.cheapestHour!.priceOreKwh) - (b.cheapestHour!.priceOreKwh))[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Zap className="h-4 w-4" />
            Elpris Sverige
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Billigaste elen just nu
          </h1>
          <p className="mt-2 text-muted-foreground">
            Lägsta elpris per elområde –{" "}
            {new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : error || !zones ? (
          <p className="text-center text-muted-foreground">Data tillfälligt otillgänglig</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {zones.map((z) => (
                <PriceCard
                  key={z.zone}
                  data={z}
                  tier={tiers[z.zone] ?? "mid"}
                  isCheapest={cheapestZone?.zone === z.zone}
                />
              ))}
            </div>

            {/* Summary */}
            {cheapestZone?.cheapestHour && (
              <div className="mt-8 rounded-lg border bg-card p-5 text-center space-y-1">
                <p className="text-sm text-muted-foreground">Billigaste elområde idag</p>
                <p className="text-lg font-semibold">
                  {cheapestZone.zone} – {cheapestZone.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  Lägsta pris:{" "}
                  <span className="font-medium text-foreground">
                    {cheapestZone.cheapestHour.priceOreKwh} öre/kWh
                  </span>
                </p>
              </div>
            )}

            {/* Updated at */}
            {dataUpdatedAt > 0 && (
              <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                Uppdaterad {new Date(dataUpdatedAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
