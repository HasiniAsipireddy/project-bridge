import { createContext, useContext } from 'react';

/**
 * Lives here rather than beside AuthProvider so that AuthContext.jsx exports
 * only a component — otherwise Vite's fast refresh gives up on the file and
 * every edit triggers a full reload.
 */
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
