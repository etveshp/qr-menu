'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="uk">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          background: '#FAF6EE',
          color: '#3E2F26',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', margin: '0 0 8px', color: '#231913' }}>
          Щось пішло не так
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#8E7A68', maxWidth: '28rem', margin: '0 0 28px' }}>
          Сталася критична помилка. Спробуйте оновити сторінку.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: '#C09E6D',
            color: '#ffffff',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Спробувати знову
        </button>
      </body>
    </html>
  );
}
