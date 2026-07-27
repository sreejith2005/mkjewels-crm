// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

import { ClientProfile } from "@/components/client-profile";
import type { Client } from "@/lib/supabase/app-types";

const client = {
  client_id: "client-1",
  primary_name: "Anita",
  primary_phone: "9012345678",
  other_names: [],
  other_known_phones: [],
  total_visits: 0,
  total_purchase_visits: 0,
  total_non_purchase_visits: 0,
  total_repair_visits: 0,
  total_order_visits: 0,
  profile_updated_at: "2026-07-27T00:00:00.000Z",
  gender: "FEMALE",
  beverage: "Tea",
  sugar: "Less sugar",
  snack: "Biscuits",
} as unknown as Client;

describe("ClientProfile walk-in control parity", () => {
  it("uses the walk-in select controls for gender and preferences", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ClientProfile client={client} timeline={[]} audit={[]} lookups={{ beverages: ["Tea", "Coffee"], snacks: ["Biscuits", "Nuts"] }} />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText("Gender").tagName).toBe("SELECT");
    expect(screen.getByLabelText("beverage").tagName).toBe("SELECT");
    expect(screen.getByLabelText("Sugar").tagName).toBe("SELECT");
    expect(screen.getByLabelText("snack").tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Coffee" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Nuts" })).toBeTruthy();
  });
});
