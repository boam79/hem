import { describe, expect, it } from "vitest";
import { parseMetricsUploadStore } from "@/lib/metrics-upload-store";

describe("parseMetricsUploadStore", () => {
  it("returns null for junk", () => {
    expect(parseMetricsUploadStore(null)).toBeNull();
    expect(parseMetricsUploadStore("{")).toBeNull();
    expect(parseMetricsUploadStore("[]")).toBeNull();
  });

  it("keeps a parsed metrics payload and file rows", () => {
    expect(
      parseMetricsUploadStore(
        JSON.stringify({
          metrics: { hospital: { name: "업로드안과(가상)" } },
          label: "업로드안과(가상) · 12개월 (업로드)",
          files: [
            {
              id: "1",
              name: "patient.csv",
              uploadedAt: "26.08.29",
              sizeLabel: "1.6KB",
              kind: "csv",
            },
            { id: 2 },
          ],
        }),
      ),
    ).toEqual({
      metrics: { hospital: { name: "업로드안과(가상)" } },
      label: "업로드안과(가상) · 12개월 (업로드)",
      files: [
        {
          id: "1",
          name: "patient.csv",
          uploadedAt: "26.08.29",
          sizeLabel: "1.6KB",
          kind: "csv",
        },
      ],
    });
  });
});
