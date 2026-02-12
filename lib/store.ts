import { create } from "zustand";

type UiStore = {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (value) =>
    set(() => ({
      sidebarOpen: value,
    })),
}));
