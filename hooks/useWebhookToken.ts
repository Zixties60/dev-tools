import { useState, useEffect } from 'react';

export function useWebhookToken(token: string | null) {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setIsValid(false);
      return;
    }

    const validateToken = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/webhook-test/validate-token?token=${token}`);
        if (response.ok) {
          setIsValid(true);
          setError(null);
        } else {
          setIsValid(false);
          setError('Invalid or expired token');
        }
      } catch (err) {
        setIsValid(false);
        setError('Failed to validate token');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  return { loading, isValid, error };
}