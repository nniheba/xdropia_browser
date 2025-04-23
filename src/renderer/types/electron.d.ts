interface ElectronAPI {
  getUserData: () => Promise<any>;
  setUserData: (userData: any) => Promise<boolean>;
  clearUserData: () => Promise<boolean>;
  checkActiveSession: (userData: any) => Promise<boolean>;
  
  preventInspection: () => Promise<boolean>;
  secureCredentials: (credentials: any) => Promise<any>;
  
  changePassword: (oldPassword: string, newPassword: string) => Promise<{
    success: boolean;
    message: string;
  }>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export {};
