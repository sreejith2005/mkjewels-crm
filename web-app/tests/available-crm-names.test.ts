import { describe, expect, it } from "vitest";

import { availableCrmNames } from "@/lib/available-crm-names";

describe("entry-queue assigned-CRM dropdown", () => {
  it("excludes an explicitly unavailable CRM for today without excluding them on another date", () => {
    const roster = [{ crm_name: "Available CRM" }, { crm_name: "Unavailable CRM" }];
    const todaysExceptions = [{ crm_name: "Unavailable CRM", is_available: false }];

    expect(availableCrmNames(roster, todaysExceptions)).toEqual(["Available CRM"]);
    expect(availableCrmNames(roster, [])).toEqual(["Available CRM", "Unavailable CRM"]);
  });
});
