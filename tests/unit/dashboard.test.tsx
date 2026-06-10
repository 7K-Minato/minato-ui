import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/page";

// Mock the fetch API
global.fetch = vi.fn();

describe("Dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders dashboard title after loading", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  it("renders add control plane button after loading", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText("+ Add Control Plane")).toBeInTheDocument();
    });
  });

  it("renders control plane cards when data is loaded", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          name: "Test CP",
          url: "http://localhost:8080",
          authType: "basic",
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        healthy: true,
        latency: 100,
        version: "1.0.0",
      }),
    });

    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Test CP")).toBeInTheDocument();
    });
  });
});
