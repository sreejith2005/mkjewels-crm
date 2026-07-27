import { describe, expect, it } from "vitest";
import { callOutcomeBucket, queueTabMatches } from "@/lib/followup-logic";

describe("legacy follow-up vocabulary", () => {
  it("buckets every non-contact outcome as CALL NOT PICKED", () => {
    for (const outcome of ["NO (CALL NOT CONNECTED)", "RINGING / NOT ANSWERED", "SWITCHED OFF", "BUSY / DECLINED"]) expect(callOutcomeBucket(outcome)).toBe("CALL NOT PICKED");
    expect(callOutcomeBucket("YES (CLIENT NEED FOLLOW-UP)")).toBe("YES (CLIENT NEED FOLLOW-UP)");
  });
  it("partitions queue tabs by legacy status", () => {
    const base={next_followup_date:"2026-07-25",followup_count:0};
    expect(queueTabMatches({status:"PENDING",...base},"today","2026-07-25")).toBe(true);
    expect(queueTabMatches({status:"PENDING",...base},"pending","2026-07-25")).toBe(true);
    expect(queueTabMatches({status:"PENDING",...base},"inprocess","2026-07-25")).toBe(false);
    expect(queueTabMatches({status:"INTERESTED - NEED FOLLOW UP",...base,followup_count:1},"inprocess","2026-07-25")).toBe(true);
    expect(queueTabMatches({status:"ALREADY PURCHASED FROM MK JEWELS",...base},"done","2026-07-25")).toBe(true);
  });
  it("keeps undated historical imports out of today and in-process views", () => {
    const historical={status:"historical",next_followup_date:null,followup_count:0};
    expect(queueTabMatches(historical,"today","2026-07-25")).toBe(false);
    expect(queueTabMatches(historical,"pending","2026-07-25")).toBe(true);
    expect(queueTabMatches(historical,"inprocess","2026-07-25")).toBe(false);
  });
  it("does not classify a newly-created lowercase pending record as in process", () => {
    expect(queueTabMatches({status:"pending",next_followup_date:"2026-07-25",followup_count:0},"inprocess","2026-07-25")).toBe(false);
  });
});
