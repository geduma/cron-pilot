import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const { handleCallback } = useAuth();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      if (processed.current) return;
      processed.current = true;

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const sessionToken = params.get('session_token');

      if (!sessionToken) {
        setError('No session token received');
        return;
      }

      const success = await handleCallback(sessionToken);

      if (success) {
        navigate('/dashboard');
      } else {
        setError('Failed to authenticate. Please try again.');
      }
    };

    processCallback();
  }, [handleCallback, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              Try again
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-gray-600">Completing login...</p>
      </div>
    </div>
  );
}
