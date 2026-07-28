// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));

import { ClientDatabase } from "@/components/client-database";

describe("ClientDatabase", () => {
  it("shows potential filtering and both daily-use actions", () => {
    render(<ClientDatabase clients={[{ client_id: "client-1", primary_name: "Anita", primary_phone: "9012345678", city: "Kochi", state: "Kerala", total_visits: 4, last_visit_date: "2026-07-25", last_buy_status: "YES", client_potential_category: "Hot Lead" }]} search="" potentialCategory="" page={1} hasMore={false} />);
    expect(screen.getByText("Client data is always live and instant; no sync step is needed.")).toBeTruthy();
    expect(screen.getAllByText("Hot Lead ★★★★☆")).toHaveLength(2);
    expect(screen.getByLabelText("Potential category")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Register Client" }).getAttribute("href")).toBe("/queue");
    expect(screen.getByRole("link", { name: "View Client Profile" }).getAttribute("href")).toBe("/clients/client-1");
    expect(screen.getByRole("link", { name: "Make Walk-in Entry" }).getAttribute("href")).toBe("/visits/new?client=client-1");
  });
});
