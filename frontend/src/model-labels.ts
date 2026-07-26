import labels from "./model-labels.json";

const labelMap: Record<string, string> = labels;

export function getModelLabel(modelId: string): string {
  return labelMap[modelId] ?? modelId;
}
