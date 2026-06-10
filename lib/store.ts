import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  selectedControlPlaneId: string | null;
  setSelectedControlPlaneId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedControlPlaneId: null,
      setSelectedControlPlaneId: (id) => set({ selectedControlPlaneId: id }),
    }),
    {
      name: "minato-app-state",
    }
  )
);
