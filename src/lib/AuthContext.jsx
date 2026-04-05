import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ForestGuard is a demo/hackathon app — no auth required
  const [user] = useState({ name: 'Procurement Analyst', role: 'viewer' });

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
