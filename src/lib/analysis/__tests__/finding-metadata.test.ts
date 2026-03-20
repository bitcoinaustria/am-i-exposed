import { describe, it, expect } from "vitest";
import {
  FINDING_METADATA,
  getFindingMeta,
  enrichFindingsWithMetadata,
} from "../finding-metadata";
import type { Finding, AdversaryTier, TemporalityClass } from "@/lib/types";

const VALID_ADVERSARY_TIERS: AdversaryTier[] = [
  "passive_observer",
  "kyc_exchange",
  "state_adversary",
];

const VALID_TEMPORALITIES: TemporalityClass[] = [
  "historical",
  "ongoing_pattern",
  "active_risk",
];

describe("FINDING_METADATA registry", () => {
  it("has at least 100 entries", () => {
    const count = Object.keys(FINDING_METADATA).length;
    expect(count).toBeGreaterThanOrEqual(100);
  });

  it("every entry has valid adversaryTiers", () => {
    for (const [id, meta] of Object.entries(FINDING_METADATA)) {
      expect(meta.adversaryTiers.length, `${id} has empty adversaryTiers`).toBeGreaterThan(0);
      for (const tier of meta.adversaryTiers) {
        expect(VALID_ADVERSARY_TIERS, `${id} has invalid tier: ${tier}`).toContain(tier);
      }
    }
  });

  it("every entry has valid temporality", () => {
    for (const [id, meta] of Object.entries(FINDING_METADATA)) {
      expect(VALID_TEMPORALITIES, `${id} has invalid temporality: ${meta.temporality}`).toContain(
        meta.temporality,
      );
    }
  });

  it("has no duplicate adversary tiers within a single entry", () => {
    for (const [id, meta] of Object.entries(FINDING_METADATA)) {
      const unique = new Set(meta.adversaryTiers);
      expect(unique.size, `${id} has duplicate adversary tiers`).toBe(meta.adversaryTiers.length);
    }
  });
});

describe("getFindingMeta", () => {
  it("returns metadata for known IDs", () => {
    const meta = getFindingMeta("h3-cioh");
    expect(meta).toBeDefined();
    expect(meta?.adversaryTiers).toContain("passive_observer");
    expect(meta?.temporality).toBe("historical");
  });

  it("returns undefined for unknown IDs", () => {
    expect(getFindingMeta("totally-unknown-id")).toBeUndefined();
  });

  it("prefix-matches h7-op-return-0", () => {
    const meta = getFindingMeta("h7-op-return-0");
    expect(meta).toBeDefined();
    expect(meta?.temporality).toBe("historical");
  });

  it("prefix-matches h7-op-return-1", () => {
    const meta = getFindingMeta("h7-op-return-1");
    expect(meta).toBeDefined();
  });

  it("prefix-matches toxic-merge-0", () => {
    const meta = getFindingMeta("toxic-merge-0");
    expect(meta).toBeDefined();
    expect(meta?.adversaryTiers).toContain("state_adversary");
  });

  it("does not prefix-match non-numeric suffixes", () => {
    // "h3-cioh" should not match via prefix for "h3-cioh-extra"
    // because "h3-cioh-extra" doesn't end with -\d+
    expect(getFindingMeta("h3-cioh-extra")).toBeUndefined();
  });
});

describe("enrichFindingsWithMetadata", () => {
  it("adds adversaryTiers and temporality to findings", () => {
    const findings: Finding[] = [
      {
        id: "h3-cioh",
        severity: "high",
        title: "test",
        description: "test",
        recommendation: "test",
        scoreImpact: -10,
      },
    ];

    enrichFindingsWithMetadata(findings);

    expect(findings[0].adversaryTiers).toEqual(["passive_observer", "kyc_exchange", "state_adversary"]);
    expect(findings[0].temporality).toBe("historical");
  });

  it("does not overwrite existing adversaryTiers", () => {
    const findings: Finding[] = [
      {
        id: "h3-cioh",
        severity: "high",
        title: "test",
        description: "test",
        recommendation: "test",
        scoreImpact: -10,
        adversaryTiers: ["passive_observer"],
        temporality: "active_risk",
      },
    ];

    enrichFindingsWithMetadata(findings);

    // Both were already set, so skip
    expect(findings[0].adversaryTiers).toEqual(["passive_observer"]);
    expect(findings[0].temporality).toBe("active_risk");
  });

  it("fills in missing temporality even if adversaryTiers is set", () => {
    const findings: Finding[] = [
      {
        id: "h3-cioh",
        severity: "high",
        title: "test",
        description: "test",
        recommendation: "test",
        scoreImpact: -10,
        adversaryTiers: ["passive_observer"],
        // temporality not set
      },
    ];

    enrichFindingsWithMetadata(findings);

    // adversaryTiers was already set but temporality was not - fill it in
    expect(findings[0].adversaryTiers).toEqual(["passive_observer"]);
    expect(findings[0].temporality).toBe("historical");
  });

  it("handles unknown finding IDs gracefully", () => {
    const findings: Finding[] = [
      {
        id: "unknown-finding",
        severity: "low",
        title: "test",
        description: "test",
        recommendation: "test",
        scoreImpact: 0,
      },
    ];

    enrichFindingsWithMetadata(findings);

    expect(findings[0].adversaryTiers).toBeUndefined();
    expect(findings[0].temporality).toBeUndefined();
  });

  it("enriches dynamic OP_RETURN IDs via prefix match", () => {
    const findings: Finding[] = [
      {
        id: "h7-op-return-2",
        severity: "low",
        title: "test",
        description: "test",
        recommendation: "test",
        scoreImpact: -3,
      },
    ];

    enrichFindingsWithMetadata(findings);

    expect(findings[0].adversaryTiers).toContain("passive_observer");
    expect(findings[0].temporality).toBe("historical");
  });
});
