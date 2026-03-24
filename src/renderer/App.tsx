import { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';
import { AboutDialog } from './components/AboutDialog';
import { Settings } from './pages/Settings';
import { WorkflowList, WorkflowEditor } from './pages/Workflows';
import { CloseConfirmDialog } from './components/CloseConfirmDialog';

function ensureLightRootClass() {
  document.documentElement.classList.remove('dark');
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.startsWith('/workflows')) return 'workflows';
    if (path.startsWith('/settings')) return 'settings';
    return 'workflows';
  };

  const currentPage = getCurrentPage();

  const handleMenuAction = async (action: string) => {
    switch (action) {
      case 'navigate-workflows':
        navigate('/workflows');
        break;
      case 'navigate-settings':
        navigate('/settings');
        break;
      case 'quit': {
        const behavior = await window.electronAPI.getCloseBehavior?.();
        if (behavior) {
          await window.electronAPI.closeWindow(behavior);
        } else {
          setCloseDialogOpen(true);
        }
        break;
      }

      case 'refresh':
      case 'force-refresh':
        window.location.reload();
        break;

      case 'preferences':
        navigate('/settings');
        break;

      case 'website':
        window.electronAPI?.openExternal('https://cflyp.com');
        break;

      case 'show-about':
        setAboutDialogOpen(true);
        break;

      default:
        console.warn('Unknown menu action:', action);
    }
  };

  const handleCloseChoice = async (behavior: 'minimize_to_tray' | 'exit', remember: boolean) => {
    setCloseDialogOpen(false);
    if (remember) {
      await window.electronAPI.setCloseBehavior?.(behavior);
    }
    await window.electronAPI.closeWindow?.(behavior);
  };

  const navigateRef = useRef(navigate);
  const subscriptionsRef = useRef<{
    navigate?: Function;
    theme?: Function;
  }>({});

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    ensureLightRootClass();

    const handleNavigate = (_event: any, page: string) => {
      const normalized =
        page === 'dashboard' ? 'workflows' : page === 'teams' ? 'workflows' : page;
      navigateRef.current(`/${normalized}`);
    };

    const handleSetTheme = (_event: any, _theme: 'light' | 'dark' | 'system') => {
      ensureLightRootClass();
    };

    if (window.electronAPI?.on) {
      subscriptionsRef.current.navigate = window.electronAPI.on('navigate-to', handleNavigate);
      subscriptionsRef.current.theme = window.electronAPI.on('set-theme', handleSetTheme);
    }

    return () => {
      if (window.electronAPI?.removeListener) {
        if (subscriptionsRef.current.navigate) {
          window.electronAPI.removeListener('navigate-to', subscriptionsRef.current.navigate);
        }
        if (subscriptionsRef.current.theme) {
          window.electronAPI.removeListener('set-theme', subscriptionsRef.current.theme);
        }
        subscriptionsRef.current = {};
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <TitleBar onAction={handleMenuAction} />

      <div className="flex flex-1 overflow-hidden">
        {!location.pathname.match(/^\/workflows\/[^/]+\/edit/) && (
          <Sidebar
            currentPage={currentPage}
            onPageChange={(page) => navigate(`/${page}`)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate to="/workflows" replace />
                }
              />
              <Route path="/workflows" element={<WorkflowList />} />
              <Route path="/workflows/:id/edit" element={<WorkflowEditor />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>

      <AboutDialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen} />

      <CloseConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onChoose={handleCloseChoice}
      />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
