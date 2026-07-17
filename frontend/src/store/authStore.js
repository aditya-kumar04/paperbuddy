import { create } from 'zustand';

// Helper to get initial state from localStorage
const getSavedAuth = () => {
  try {
    const saved = localStorage.getItem('paperbuddy_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        user: parsed.user || null,
        token: parsed.token || null,
        refreshToken: parsed.refreshToken || null,
        isAuthenticated: !!parsed.token,
      };
    }
  } catch (e) {
    console.error('Error loading saved auth from localStorage:', e);
  }
  return {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
  };
};

export const useAuthStore = create((set) => {
  const initial = getSavedAuth();
  
  return {
    user: initial.user,
    token: initial.token,
    refreshToken: initial.refreshToken,
    isAuthenticated: initial.isAuthenticated,
    
    login: (user, token, refreshToken) => {
      localStorage.setItem('paperbuddy_auth', JSON.stringify({ user, token, refreshToken }));
      set({ user, token, refreshToken, isAuthenticated: true });
    },
    
    logout: () => {
      localStorage.removeItem('paperbuddy_auth');
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    },
    
    updateUser: (updatedFields) => {
      set((state) => {
        if (!state.user) return {};
        const newUser = { ...state.user, ...updatedFields };
        localStorage.setItem(
          'paperbuddy_auth', 
          JSON.stringify({ user: newUser, token: state.token, refreshToken: state.refreshToken })
        );
        return { user: newUser };
      });
    }
  };
});
