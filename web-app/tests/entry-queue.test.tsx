// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
const rpc = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ rpc }) }));

import { EntryQueue } from "@/components/entry-queue";

const branchId = "10000000-0000-4000-8000-000000000601";
function renderQueue() {
  return render(<EntryQueue profile={{ role: "salesperson", branchId }} selectedBranchId={branchId} selectedCrm="" branches={[{ id: branchId, name: "Test Branch" }]} crms={["Test CRM"]} queueCrms={["Test CRM"]} initialItems={[{ id: "queue-1", token: "0725-ABCDE", client_name: "Queued Client", mobile: "9012345601", assigned_crm_name: "Test CRM", status: "pending", created_at: "2026-07-25T09:00:00Z", client_id: null }, { id: "queue-2", token: "0725-DONE01", client_name: "Submitted Client", mobile: "9012345603", assigned_crm_name: "Test CRM", status: "complete", created_at: "2026-07-25T10:00:00Z", client_id: "client-2" }]} />);
}

afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("consolidated client walk-in queue", () => {
  it("registers in place, preserves entered values, and exposes only queue-originated walk-in actions", async () => {
    rpc.mockImplementation((name: string) => name === "lookup_client_by_phone" ? Promise.resolve({ data: [], error: null }) : Promise.resolve({ data: [{ token: "0725-NEW01", client_type: "new" }], error: null }));
    renderQueue();
    fireEvent.change(screen.getAllByRole("textbox")[0]!, { target: { value: "New Queue Client" } });
    fireEvent.change(screen.getByLabelText("Mobile Number"), { target: { value: "9012345602" } });
    fireEvent.click(screen.getByRole("button", { name: "REGISTER CLIENT" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Client registered: token 0725-NEW01"));
    expect(screen.getByDisplayValue("New Queue Client")).toBeTruthy();
    expect(screen.getByDisplayValue("9012345602")).toBeTruthy();
    expect(screen.getByRole("link", { name: "ADD WALKIN ENTRY" }).getAttribute("href")).toBe("/visits/new?queue=queue-1");
    expect(screen.queryByText("Direct walk-in")).toBeNull();
  });

  it("keeps completed visits out of the active queue but makes them reviewable in Recently submitted", () => {
    renderQueue();
    expect(screen.queryByText("Submitted Client")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Recently submitted" }));
    expect(screen.getByText("Submitted Client")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Review client record" }).getAttribute("href")).toBe("/clients/client-2");
  });

  it("loads the legacy branch and CRM filter into the canonical queue URL", () => {
    renderQueue();
    fireEvent.change(screen.getByLabelText("CRM NAME"), { target: { value: "Test CRM" } });
    fireEvent.click(screen.getByRole("button", { name: "LOAD QUEUE" }));
    expect(push).toHaveBeenCalledWith(`/queue?branch=${branchId}&crm=Test+CRM`);
  });
});
