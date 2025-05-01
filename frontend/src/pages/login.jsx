import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import AuthForm from '../components/authform';
import Alert from '../components/alert';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const navigate = useNavigate();
  const { login, isAuthenticated, error, clearErrors } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated ) {
      navigate('/dashboard');
    }

    // If there's an error, display it
    if (error) {
      setAlertInfo({
        message: error,
        type: 'error'
      });
      clearErrors();
    }
  }, [isAuthenticated, error, navigate, clearErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setAlertInfo({
        message: err.message || 'Login failed',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loginFields = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'Email address'
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      placeholder: 'Password'
    }
  ];

  return (
    <div className="login-container bg-gray-600 ">
      {alertInfo && (
        <div className="mx-auto max-w-md mt-4">
          <Alert
            message={alertInfo.message}
            type={alertInfo.type}
            onClose={() => setAlertInfo(null)}
          />
        </div>
      )}
      
      <AuthForm
        title="Sign in to your account"
        fields={loginFields}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        buttonText="Sign in"
        isLoading={loading}
        alternateAction={
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        }
      />
    </div>
  );
};

export default Login;