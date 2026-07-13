import { useState, useEffect } from 'react';
import { authApi } from '../../services/auth';
import { useAuth } from '../../hooks/useAuth';
import type { Provider } from '../../types';

export function LoginButtons() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { login } = useAuth();

  useEffect(() => {
    const fetchProviders = async () => {
      const data = await authApi.getProviders();
      setProviders(data);
      setIsLoading(false);
    };

    fetchProviders();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No login providers available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <button
          key={provider.providerId}
          onClick={() => login(provider.providerId)}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {provider.icon && (
            <img
              className="h-5 w-5 mr-2"
              src={provider.icon}
              alt={provider.displayName}
            />
          )}
          Continue with {provider.displayName}
        </button>
      ))}
    </div>
  );
}
