"use client";

type UserSettings = {
  rightSidebarActivePanel: string | null;
};

const STORAGE_KEY = "miniorg-user-settings";

const DEFAULT_SETTINGS: UserSettings = {
  rightSidebarActivePanel: "timeline",
};

export class UserSettingsStore {
  private static instance: UserSettingsStore;
  private settings: UserSettings;
  private listeners: Set<(settings: UserSettings) => void> = new Set();

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): UserSettingsStore {
    if (!UserSettingsStore.instance) {
      UserSettingsStore.instance = new UserSettingsStore();
    }
    return UserSettingsStore.instance;
  }

  private loadSettings(): UserSettings {
    if (typeof window === "undefined") {
      return DEFAULT_SETTINGS;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
    }

    return DEFAULT_SETTINGS;
  }

  private saveSettings() {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to save user settings:", error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.settings));
  }

  subscribe(listener: (settings: UserSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSettings(): UserSettings {
    return { ...this.settings };
  }

  setRightSidebarActivePanel(panel: string | null) {
    this.settings.rightSidebarActivePanel = panel;
    this.saveSettings();
  }

  getRightSidebarActivePanel(): string | null {
    return this.settings.rightSidebarActivePanel;
  }
}

export const userSettingsStore = UserSettingsStore.getInstance();
