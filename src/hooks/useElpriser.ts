import { useQuery } from "@tanstack/react-query";

interface PriceEntry {
  SEK_per_kWh: number;
  EUR_per_kWh: number;
  EXR: number;
  time_start: string;
  time_end: string;
}

export interface ZoneResult {
  zone: string;
  label: string;
  cheapestHour: {
    start: string;
    end: string;
    priceOreKwh: number;
  } | null;
  error: boolean;
}

const ZONES = [
  { zone: "SE1", label: "Luleå" },
  { zone: "SE2", label: "Sundsvall" },
  { zone: "SE3", label: "Stockholm" },
  { zone: "SE4", label: "Malmö" },
];

async function fetchZonePrices(zone: string): Promise<PriceEntry[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const url = `https://www.elprisetjustnu.se/api/v1/prices/${year}/${month}-${day}_${zone}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${zone}`);
  return res.json();
}

async function fetchAllZones(): Promise<ZoneResult[]> {
  const results = await Promise.allSettled(
    ZONES.map(async ({ zone, label }) => {
      try {
        const prices = await fetchZonePrices(zone);
        if (!prices.length) return { zone, label, cheapestHour: null, error: false };

        const cheapest = prices.reduce((min, p) =>
          p.SEK_per_kWh < min.SEK_per_kWh ? p : min
        );

        return {
          zone,
          label,
          cheapestHour: {
            start: cheapest.time_start,
            end: cheapest.time_end,
            priceOreKwh: Math.round(cheapest.SEK_per_kWh * 100 * 10) / 10,
          },
          error: false,
        };
      } catch {
        return { zone, label, cheapestHour: null, error: true };
      }
    })
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { zone: "?", label: "?", cheapestHour: null, error: true }
  );
}

export function useElpriser() {
  return useQuery({
    queryKey: ["elpriser"],
    queryFn: fetchAllZones,
    refetchInterval: 1000 * 60 * 15,
    staleTime: 1000 * 60 * 10,
  });
}
