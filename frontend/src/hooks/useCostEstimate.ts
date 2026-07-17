import { useEffect, useState } from "react";
import { useApi } from "./useApi";
import { routes } from "../api/routes";

export interface CostEstimate {
  estimated_tokens_in: number;
  estimated_tokens_out: number;
  estimated_cost_usd: number;
  stages: string[];
  quick_model_price: { input: number; output: number };
  deep_model_price: { input: number; output: number };
  provider: string;
}

export function useCostEstimate(formData: {
  ticker: string;
  date: string;
  analysts: string[];
  research_depth: number;
  provider: string;
  quick_model: string;
  deep_model: string;
}) {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  const [, { execute }] = useApi<CostEstimate>(routes.estimate.estimate.path, {
    retry: { maxRetries: 2 },
  });

  useEffect(() => {
    if (!formData.ticker || !formData.date) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await execute({ method: "POST", body: formData });
        if (data) setEstimate(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    formData.ticker,
    formData.date,
    JSON.stringify(formData.analysts),
    formData.research_depth,
    formData.provider,
    formData.quick_model,
    formData.deep_model,
    execute,
  ]);

  return { estimate, loading };
}
