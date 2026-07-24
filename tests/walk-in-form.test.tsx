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

function openEngagementStep() {
  fireEvent.click(screen.getByRole("button", { name: "5. Engagement asks" }));
}

function engagementRow(label: string) {
  return screen.getByText(label).closest("div");
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WalkInForm proof image uploads", () => {
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
