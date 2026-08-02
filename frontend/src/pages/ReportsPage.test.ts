import { describe, it, expect } from "vitest";
import { sortByMostRecent, reportTimestamp } from "./ReportsPage";

describe("sortByMostRecent", () => {
  it("orders reports by modified descending", () => {
    const reports = [
      { id: "AAPL_20260801_100000", ticker: "AAPL", date: "", path: "", size_bytes: 0, modified: 100 },
      { id: "MSFT_20260802_090000", ticker: "MSFT", date: "", path: "", size_bytes: 0, modified: 300 },
      { id: "GOOG_20260801_120000", ticker: "GOOG", date: "", path: "", size_bytes: 0, modified: 200 },
    ];
    expect(sortByMostRecent(reports).map((r) => r.id)).toEqual([
      "MSFT_20260802_090000",
      "GOOG_20260801_120000",
      "AAPL_20260801_100000",
    ]);
  });

  it("is stable on ties, preferring the lexicographically larger id", () => {
    const reports = [
      { id: "AAPL_20260802_120000", ticker: "AAPL", date: "", path: "", size_bytes: 0, modified: 100 },
      { id: "AAPL_20260802_130000", ticker: "AAPL", date: "", path: "", size_bytes: 0, modified: 100 },
      { id: "MSFT_20260801_090000", ticker: "MSFT", date: "", path: "", size_bytes: 0, modified: 100 },
    ];
    expect(sortByMostRecent(reports).map((r) => r.id)).toEqual([
      "MSFT_20260801_090000",
      "AAPL_20260802_130000",
      "AAPL_20260802_120000",
    ]);
  });

  it("does not mutate the input array", () => {
    const reports = [
      { id: "A_1", ticker: "A", date: "", path: "", size_bytes: 0, modified: 1 },
      { id: "B_2", ticker: "B", date: "", path: "", size_bytes: 0, modified: 2 },
    ];
    sortByMostRecent(reports);
    expect(reports.map((r) => r.id)).toEqual(["A_1", "B_2"]);
  });
});

describe("reportTimestamp", () => {
  it("strips the ticker prefix from a standard report id", () => {
    expect(reportTimestamp("AAPL_20260802_121032")).toBe("20260802_121032");
  });

  it("returns the full id when there is no ticker prefix", () => {
    expect(reportTimestamp("20260802_121032")).toBe("20260802_121032");
    expect(reportTimestamp("AAPL")).toBe("AAPL");
  });
});
