// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
const update = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ from: () => ({ update }) }) }));

import { AllocationManager } from "@/components/allocation-manager";

afterEach(() => vi.restoreAllMocks());

describe("AllocationManager pending assignment safety", () => {
  it("requires confirmation before deactivating a CRM with pending entry-queue assignments", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AllocationManager role="branch_manager" branchId="10000000-0000-4000-8000-000000000401" branches={[]} date="2026-07-24" unavailableNames={[]} roster={[{ id: "50000000-0000-4000-8000-000000000401", crm_name: "Pending CRM", active: true, pending_count: 2 }]} />);

    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(confirm).toHaveBeenCalledWith("Pending CRM has 2 pending queue assignment(s). Deactivate anyway? Existing assignments will remain intact.");
    expect(update).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
