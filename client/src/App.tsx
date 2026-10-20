import { useState, useEffect } from 'react';
import { BrandSection } from './components/BrandSection.tsx';
import { SignInForm } from './components/SignInForm.tsx';
import { SignUpForm } from './components/SignUpForm.tsx';
import { WelcomeView } from './components/WelcomeView.tsx';
import { api } from './api.ts';
import type { User, AuthMode } from './types.ts';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isInitializing, setIsInitializing] = useState(true);

  // Check if user already has an active session on app load
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const response = await api.getMe();
        if (isMounted) {
          if (response.data?.user) {
            setCurrentUser(response.data.user);
          } else {
            setCurrentUser(null);
          }
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('signin');
  };

  if (isInitializing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-main)',
        }}
      >
        <span className="spinner" style={{ width: '24px', height: '24px' }} />
      </div>
    );
  }

  // If user is authenticated, render Welcome view
  if (currentUser) {
    return <WelcomeView user={currentUser} onLogout={handleLogout} />;
  }

  // Otherwise, render split-screen auth layout (defaults to Sign In)
  return (
    <div className="app-container">
      <div className="split-layout">
        <BrandSection />
        <main className="auth-column" aria-label="Authentication">
          {authMode === 'signin' ? (
            <SignInForm
              onSuccess={handleAuthSuccess}
              onSwitchToSignUp={() => setAuthMode('signup')}
            />
          ) : (
            <SignUpForm
              onSuccess={handleAuthSuccess}
              onSwitchToSignIn={() => setAuthMode('signin')}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
