import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../utils/api';

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};

// Create context
const AuthContext = createContext(initialState);

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        loading: false,
        error: null
      };
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.data,
        loading: false,
        error: null
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on first run or refresh
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.token) {
        try {
          const userData = await getCurrentUser();
          dispatch({
            type: 'USER_LOADED',
            payload: userData
          });
        } catch (err) {
          dispatch({
            type: 'AUTH_ERROR',
            payload: err.message
          });
        }
      } else {
        dispatch({
          type: 'AUTH_ERROR',
          payload: null
        });
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      const data = await registerUser(formData);
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: data
      });
      return data;
    } catch (err) {
      dispatch({
        type: 'REGISTER_FAIL',
        payload: err.message
      });
      throw err;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const data = await loginUser(formData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: data
      });
      return data;
    } catch (err) {
      dispatch({
        type: 'LOGIN_FAIL',
        payload: err.message
      });
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Clear errors
  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        loading: state.loading,
        error: state.error,
        register,
        login,
        logout,
        clearErrors
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;