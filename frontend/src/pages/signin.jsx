import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import AuthForm from '../components/authform';
import Alert from '../components/alert';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer',
    aadhaarNumber: '',
    panNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const navigate = useNavigate();
  const { register, isAuthenticated, error, clearErrors } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
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
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setAlertInfo({
        message: err.message || 'Registration failed',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const signupFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'John Doe'
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'john@example.com'
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      placeholder: 'Minimum 6 characters',
      minLength: 6
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'buyer', label: 'Buyer' },
        { value: 'landowner', label: 'Landowner' },
        { value: 'government', label: 'Government Official' }
      ]
    },
    {
      name: 'aadhaarNumber',
      label: 'Aadhaar Number',
      type: 'text',
      required: true,
      placeholder: '12-digit Aadhaar number',
      minLength: 12,
      maxLength: 12
    },
    {
      name: 'panNumber',
      label: 'PAN Number',
      type: 'text',
      required: true,
      placeholder: '10-character PAN number',
      minLength: 10,
      maxLength: 10
    }
  ];

  return (
    <div className="signup-container">
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
        title="Create a new account"
        fields={signupFields}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        buttonText={loading ? 'Processing...' : 'Sign up'}
        isLoading={loading}
        alternateAction={
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        }
      />
    </div>
  );
};

export default Signup;