import { createContext, useContext, useState, useEffect } from 'react';
import customerApi from '../services/customerApi';

const CustomerContext = createContext();

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null
  );

  useEffect(() => {
    const loadCustomer = async () => {
      const savedToken = localStorage.getItem('customerToken');
      if (savedToken) {
        try {
          const response = await customerApi.getProfile(savedToken);
          setCustomer(response.data);
          setToken(savedToken);
        } catch (error) {
          // Only log out if the token is genuinely invalid (401/403).
          // Transient errors (network, 500, DB cold-start) keep the session.
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem('customerToken');
            setToken(null);
          } else {
            setToken(savedToken);  // keep them logged in
          }
        }
      }
      setLoading(false);
    };

    loadCustomer();
  }, []);

  const login = (authData) => {
    setCustomer({
      id: authData.customerId,
      fullName: authData.fullName,
      phoneNumber: authData.phoneNumber,
      email: authData.email,
    });
    setToken(authData.token);
    localStorage.setItem('customerToken', authData.token);
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    localStorage.removeItem('customerToken');
  };

  const refreshProfile = async () => {
    if (token) {
      try {
        const response = await customerApi.getProfile(token);
        setCustomer(response.data);
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      }
    }
  };

  return (
    <CustomerContext.Provider value={{
      customer,
      token,
      loading,
      login,
      logout,
      refreshProfile,
      isAuthenticated: !!token,
    }}>
      {children}
    </CustomerContext.Provider>
  );
};
