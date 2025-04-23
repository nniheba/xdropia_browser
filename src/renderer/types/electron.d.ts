interface ElectronAPI {
  getUserData: () => Promise<any>;
  setUserData: (userData: any) => Promise<boolean>;
  clearUserData: () => Promise<boolean>;
  checkActiveSession: (userData: any) => Promise<boolean>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export {};
