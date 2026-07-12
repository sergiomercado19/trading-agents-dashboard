import { useEffect, useState } from "react";
import { postJson } from "../api/client";

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

  useEffect(() => {
    if (!formData.ticker || !formData.date) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await postJson<CostEstimate>("/estimate", formData);
        setEstimate(data);
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
  ]);

  return { estimate, loading };
}
