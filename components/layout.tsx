import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMounted, setIsMounted] = useState(false);

  const { user, error, isLoading } = useUser();

  // fixes hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  // todo: must configure Auth0 with vercel
  const isLocalhost =
    typeof window !== 'undefined' && window.location.host.includes('localhost');

  return (
    <div className="mx-auto flex flex-col space-y-4">
      <header className="container sticky top-0 z-40 bg-white">
        <div className="h-16 border-b border-b-slate-200 py-4">
          <nav className="ml-4 pl-6">
            {isLocalhost && user && !isLoading ? (
              <>
                <Link
                  href="/api/auth/logout"
                  className="hover:text-slate-600 cursor-pointer"
                >
                  Log Out
                </Link>
                <span className="text-slate-600 ml-6">
                  Logged in as {user.email}
                </span>
              </>
            ) : (
              <Link
                href="/api/auth/login"
                className="hover:text-slate-600 cursor-pointer"
              >
                Log In
              </Link>
            )}
          </nav>
        </div>
      </header>
      <div>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
