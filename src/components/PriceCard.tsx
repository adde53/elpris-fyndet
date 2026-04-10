import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ZoneResult } from "@/hooks/useElpriser";
import { Zap } from "lucide-react";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Tier = "cheap" | "mid" | "expensive";

const tierStyles: Record<Tier, string> = {
  cheap: "border-price-cheap/40 bg-price-cheap/5",
  mid: "border-price-mid/40 bg-price-mid/5",
  expensive: "border-price-expensive/40 bg-price-expensive/5",
};

const tierDotStyles: Record<Tier, string> = {
  cheap: "bg-price-cheap",
  mid: "bg-price-mid",
  expensive: "bg-price-expensive",
};

interface PriceCardProps {
  data: ZoneResult;
  tier: Tier;
  isCheapest: boolean;
}

export function PriceCard({ data, tier, isCheapest }: PriceCardProps) {
  const { zone, label, cheapestHour, error } = data;

  return (
    <Card className={`relative transition-all duration-300 hover:shadow-md ${tierStyles[tier]}`}>
      {isCheapest && (
        <Badge className="absolute -top-3 left-4 bg-price-cheap text-primary-foreground border-0 gap-1">
          <Zap className="h-3 w-3" />
          Billigast idag
        </Badge>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>
            {zone} – {label}
          </span>
          <span className={`h-3 w-3 rounded-full ${tierDotStyles[tier]}`} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error || !cheapestHour ? (
          <p className="text-sm text-muted-foreground">Data tillfälligt otillgänglig</p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Billigaste timmen:{" "}
              <span className="font-medium text-foreground">
                {formatTime(cheapestHour.start)}–{formatTime(cheapestHour.end)}
              </span>
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {cheapestHour.priceOreKwh} <span className="text-sm font-normal text-muted-foreground">öre/kWh</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
