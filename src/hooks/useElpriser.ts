import { useQuery } from "@tanstack/react-query";

interface PriceEntry {
  SEK_per_kWh: number;
  EUR_per_kWh: number;
  EXR: number;
  time_start: string;
  time_end: string;
}

interface HourPrice {
  start: string;
  end: string;
  priceOreKwh: number;
}

export interface ZoneResult {
  zone: string;
  label: string;
  cheapestUpcoming: HourPrice | null;
  cheapestOverall: HourPrice | null;
  overallIsPast: boolean;
  error: boolean;
}

const ZONES = [
  { zone: "SE1", label: "Luleå" },
  { zone: "SE2", label: "Sundsvall" },
  { zone: "SE3", label: "Stockholm" },
  { zone: "SE4", label: "Malmö" },
];

function toHourPrice(p: PriceEntry): HourPrice {
  return {
    start: p.time_start,
    end: p.time_end,
    priceOreKwh: Math.round(p.SEK_per_kWh * 100 * 10) / 10,
  };
}

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
  const now = new Date();

  const results = await Promise.allSettled(
    ZONES.map(async ({ zone, label }) => {
      try {
        const prices = await fetchZonePrices(zone);
        if (!prices.length) return { zone, label, cheapestUpcoming: null, cheapestOverall: null, overallIsPast: false, error: false };

        const cheapestAll = prices.reduce((min, p) => (p.SEK_per_kWh < min.SEK_per_kWh ? p : min));
        const upcoming = prices.filter((p) => new Date(p.time_end) > now);
        const cheapestUp = upcoming.length
          ? upcoming.reduce((min, p) => (p.SEK_per_kWh < min.SEK_per_kWh ? p : min))
          : null;

        const overallIsPast = new Date(cheapestAll.time_end) <= now;

        return {
          zone,
          label,
          cheapestUpcoming: cheapestUp ? toHourPrice(cheapestUp) : null,
          cheapestOverall: toHourPrice(cheapestAll),
          overallIsPast,
          error: false,
        };
      } catch {
        return { zone, label, cheapestUpcoming: null, cheapestOverall: null, overallIsPast: false, error: true };
      }
    })
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { zone: "?", label: "?", cheapestUpcoming: null, cheapestOverall: null, overallIsPast: false, error: true }
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
