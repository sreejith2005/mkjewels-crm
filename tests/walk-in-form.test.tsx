// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const rpc = vi.fn();
const upload = vi.fn();
const remove = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc,
    storage: {
      from: () => ({ upload, remove }),
    },
  }),
}));

import { WalkInForm } from "@/components/walk-in-form";
import type { Client } from "@/lib/supabase/app-types";

const branchId = "10000000-0000-4000-8000-000000000501";

function renderWalkInForm() {
  return render(
    <WalkInForm
      profile={{ role: "salesperson", branchId, name: "Test CRM" }}
      branches={[{ id: branchId, name: "Test Branch" }]}
      crms={["Test CRM"]}
      queue={null}
      client={null}
    />,
  );
}

function renderPrefilledWalkInForm() {
  return render(<WalkInForm profile={{ role: "salesperson", branchId, name: "Test CRM" }} branches={[{ id: branchId, name: "Test Branch" }]} crms={["Test CRM"]} queue={null} client={{ client_id: "20000000-0000-4000-8000-000000000501", primary_name: "Known Client", primary_phone: "9012345678" } as unknown as Client} />);
}
function renderQueuedWalkInForm() {
  return render(<WalkInForm profile={{ role: "salesperson", branchId, name: "Test CRM" }} branches={[{ id: branchId, name: "Test Branch" }]} crms={["Test CRM"]} queue={{ id: "queue-501", client_name: "Queue Client", mobile: "9012345509", branch_id: branchId, assigned_crm_name: "Test CRM", client_id: null, status: "pending" }} client={null} />);
}

function openEngagementStep() {
  fireEvent.click(screen.getByRole("button", { name: "5. Engagement asks" }));
}

function engagementRow(label: string) {
  return screen.getByText(label).closest("div");
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("WalkInForm proof image uploads", () => {
  it("auto-fills a matched phone profile and keeps a manually edited value", async () => {
    rpc.mockImplementation((name: string) => name === "lookup_client_by_phone" ? Promise.resolve({ data: [{ client_id: "20000000-0000-4000-8000-000000000599", primary_name: "Phone Match", primary_phone: "9012345599", gender: "Female", dob: "1990-01-02", community: "Nair", address: "Main Road", pincode: "682001", country: "India", state: "Kerala", city: "Kochi" }], error: null }) : Promise.resolve({ data: [], error: null }));
    renderWalkInForm();
    fireEvent.change(screen.getByLabelText("Mobile *"), { target: { value: "9012345599" } });
    await waitFor(() => expect(screen.getByDisplayValue("Phone Match")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "2. Profile" }));
    await waitFor(() => expect(screen.getByDisplayValue("Female")).toBeTruthy());
    expect(screen.getAllByText("Auto-filled from client history — editable").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByDisplayValue("Female"), { target: { value: "Other" } });
    expect(screen.getByDisplayValue("Other")).toBeTruthy();
  });

  it("leaves typed values in place when the phone has no matching client", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    renderWalkInForm();
    fireEvent.change(screen.getByLabelText("Client name *"), { target: { value: "Unmatched Client" } });
    fireEvent.change(screen.getByLabelText("Mobile *"), { target: { value: "9012345598" } });
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    expect(screen.getByDisplayValue("Unmatched Client")).toBeTruthy();
    expect(screen.queryByText("Auto-filled from client history — editable")).toBeNull();
  });

  it("returns to the queue with the completed client confirmation after submission", async () => {
    rpc.mockImplementation((name: string) => name === "lookup_client_by_phone" ? Promise.resolve({ data: [], error: null }) : Promise.resolve({ data: [{ client_id: "20000000-0000-4000-8000-000000000509", timeline_id: "40000000-0000-4000-8000-000000000509", reference_number: "TES-260725-0001" }], error: null }));
    const { container } = renderQueuedWalkInForm();
    fireEvent.click(screen.getByRole("button", { name: "6. Preferences & planning" }));
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/queue?completed=Queue%20Client"));
  });

  it("prefills an existing client for a make walk-in entry shortcut", () => { renderPrefilledWalkInForm(); expect(screen.getByDisplayValue("Known Client")).toBeTruthy(); expect(screen.getByDisplayValue("9012345678")).toBeTruthy(); expect(screen.getByText("Existing client detected")).toBeTruthy(); });
  it("reveals an image upload control when an engagement ask is yes and keeps it hidden when no", () => {
    renderWalkInForm();
    openEngagementStep();

    const instagram = engagementRow("Instagram follow");
    expect(instagram).not.toBeNull();
    const instagramControls = within(instagram!);
    const instagramSelect = instagramControls.getByRole("combobox");

    fireEvent.change(instagramSelect, { target: { value: "yes" } });
    expect(instagramControls.getByLabelText("Instagram follow proof image")).toBeTruthy();
    expect(instagramControls.getByText("Proof image is required.")).toBeTruthy();

    fireEvent.change(instagramSelect, { target: { value: "no" } });
    expect(instagramControls.queryByLabelText("Instagram follow proof image")).toBeNull();
    expect(instagramControls.getByPlaceholderText("Reason")).toBeTruthy();
  });

  it("removes uploaded proof images when submit_walkin_visit fails", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "forced transaction failure" } });
    upload.mockResolvedValueOnce({ error: null });
    remove.mockResolvedValue({ error: null });

    const originalRandomUUID = crypto.randomUUID;
    const ids = [
      "20000000-0000-4000-8000-000000000501",
      "40000000-0000-4000-8000-000000000501",
      "50000000-0000-4000-8000-000000000501",
    ];
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => ids.shift() ?? originalRandomUUID.call(crypto));

    const { container } = renderWalkInForm();
    fireEvent.change(screen.getByLabelText("Client name *"), { target: { value: "Upload Failure Client" } });
    fireEvent.change(screen.getByLabelText("Mobile *"), { target: { value: "9012345501" } });
    openEngagementStep();

    const googleReview = engagementRow("Google review");
    expect(googleReview).not.toBeNull();
    const googleReviewControls = within(googleReview!);
    fireEvent.change(googleReviewControls.getByRole("combobox"), { target: { value: "yes" } });
    const proof = new File(["proof"], "review-proof.jpg", { type: "image/jpeg" });
    fireEvent.change(googleReviewControls.getByLabelText("Google review proof image"), { target: { files: [proof] } });

    await waitFor(() => expect(upload).toHaveBeenCalledOnce());
    const uploadedPath = upload.mock.calls[0][0];
    expect(uploadedPath).toBe("20000000-0000-4000-8000-000000000501/40000000-0000-4000-8000-000000000501/50000000-0000-4000-8000-000000000501_review-proof.jpg");

    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(rpc).toHaveBeenCalledWith("submit_walkin_visit", expect.any(Object)));
    await waitFor(() => expect(remove).toHaveBeenCalledWith([uploadedPath]));
    expect(screen.getByText("Could not submit this visit. Uploaded proof images were removed.")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it("blocks submission when an engagement ask is yes without an uploaded proof image", async () => {
    const { container } = renderWalkInForm();
    fireEvent.change(screen.getByLabelText("Client name *"), { target: { value: "Missing Proof Client" } });
    fireEvent.change(screen.getByLabelText("Mobile *"), { target: { value: "9012345502" } });
    openEngagementStep();

    const testimonial = engagementRow("Testimonial");
    expect(testimonial).not.toBeNull();
    fireEvent.change(within(testimonial!).getByRole("combobox"), { target: { value: "yes" } });

    fireEvent.submit(container.querySelector("form")!);

    expect(await screen.findByText("Testimonial needs a proof image before submission.")).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
