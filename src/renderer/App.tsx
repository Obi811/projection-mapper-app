/**
 * Root Application Component
 *
 * Sets up routing and provides the top-level layout.
 * Future additions: global error boundary, auth provider, theme provider.
 */

import React, { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { ProjectionPage } from './pages/ProjectionPage';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simple auth gate — will be replaced by a proper auth context/provider
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <ProjectionPage />;
};
