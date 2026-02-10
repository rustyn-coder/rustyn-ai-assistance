import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastProvider, ToastViewport } from "./components/ui/toast";
import RustynInterface from "./components/RustynInterface";
import SettingsPopup from "./components/SettingsPopup";
import AdvancedSettings from "./components/AdvancedSettings";
import Launcher from "./components/Launcher";
import SettingsOverlay from "./components/SettingsOverlay";
import StartupSequence from "./components/StartupSequence";
import { AnimatePresence, motion } from "framer-motion";
import UpdateBanner from "./components/UpdateBanner";
import LoginPage, {
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
  verifyStoredToken,
} from "./components/LoginPage";

const queryClient = new QueryClient();

const App: React.FC = () => {
  const isSettingsWindow =
    new URLSearchParams(window.location.search).get("window") === "settings";
  const isAdvancedWindow =
    new URLSearchParams(window.location.search).get("window") === "advanced";
  const isLauncherWindow =
    new URLSearchParams(window.location.search).get("window") === "launcher";
  const isOverlayWindow =
    new URLSearchParams(window.location.search).get("window") === "overlay";

  // Default to launcher if not specified (dev mode safety)
  const isDefault = !isSettingsWindow && !isAdvancedWindow && !isOverlayWindow;

  // ============================================
  // Auth State
  // ============================================
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authUser, setAuthUser] = useState<string | null>(null);

  // State
  const [showStartup, setShowStartup] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ============================================
  // Check stored token on mount
  // ============================================
  useEffect(() => {
    // Settings, Advanced, and Overlay windows skip auth check
    // They are child windows that already require the user to be logged in
    if (isSettingsWindow || isAdvancedWindow || isOverlayWindow) {
      setIsAuthenticated(true);
      setAuthChecking(false);
      return;
    }

    const checkAuth = async () => {
      setAuthChecking(true);
      try {
        const token = getStoredToken();
        if (token) {
          // Verify the token is still valid with the backend
          const isValid = await verifyStoredToken();
          if (isValid) {
            setIsAuthenticated(true);
            setAuthUser(getStoredUser());
          } else {
            // Token expired or invalid — clear it
            clearStoredAuth();
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [isSettingsWindow, isAdvancedWindow, isOverlayWindow]);

  // ============================================
  // Auth Handlers
  // ============================================
  const handleLoginSuccess = (_token: string, username: string) => {
    setIsAuthenticated(true);
    setAuthUser(username);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setIsAuthenticated(false);
    setAuthUser(null);
  };

  // ============================================
  // Meeting Handlers
  // ============================================
  const handleStartMeeting = async () => {
    try {
      const inputDeviceId = localStorage.getItem("preferredInputDeviceId");
      let outputDeviceId = localStorage.getItem("preferredOutputDeviceId");
      const useLegacyAudio =
        localStorage.getItem("useLegacyAudioBackend") === "true";

      if (!useLegacyAudio) {
        outputDeviceId = "sck";
      }

      const result = await window.electronAPI.startMeeting({
        audio: { inputDeviceId, outputDeviceId },
      });
      if (result.success) {
        await window.electronAPI.setWindowMode("overlay");
      }
    } catch (err) {
      console.error("[App] Failed to start meeting:", err);
    }
  };

  const handleEndMeeting = async () => {
    try {
      await window.electronAPI.endMeeting();
      await window.electronAPI.setWindowMode("launcher");
    } catch (err) {
      console.error("[App] Failed to end meeting:", err);
      window.electronAPI.setWindowMode("launcher");
    }
  };

  // ============================================
  // Render: Settings Window
  // ============================================
  if (isSettingsWindow) {
    return (
      <div className="h-full min-h-0 w-full">
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <SettingsPopup />
            <ToastViewport />
          </ToastProvider>
        </QueryClientProvider>
      </div>
    );
  }

  // ============================================
  // Render: Advanced Settings Window
  // ============================================
  if (isAdvancedWindow) {
    return (
      <div className="h-full min-h-0 w-full">
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AdvancedSettings />
            <ToastViewport />
          </ToastProvider>
        </QueryClientProvider>
      </div>
    );
  }

  // ============================================
  // Render: Overlay Window (Meeting Interface)
  // ============================================
  if (isOverlayWindow) {
    return (
      <div className="w-full relative bg-transparent">
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RustynInterface onEndMeeting={handleEndMeeting} />
            <ToastViewport />
          </ToastProvider>
        </QueryClientProvider>
      </div>
    );
  }

  // ============================================
  // Render: Auth Loading Spinner (checking stored token)
  // ============================================
  if (authChecking) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #0a0a0f 0%, #0d0d14 30%, #111118 60%, #0a0a10 100%)",
          zIndex: 9999,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            style={{
              width: 32,
              height: 32,
              border: "3px solid rgba(59, 130, 246, 0.15)",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              fontSize: 13,
              color: "#52525b",
              fontFamily: "var(--font-system)",
              letterSpacing: "0.02em",
            }}
          >
            Checking session...
          </span>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // Render: Login Page (not authenticated)
  // ============================================
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ============================================
  // Render: Launcher Window (Default — Authenticated)
  // ============================================
  return (
    <div className="h-full min-h-0 w-full relative">
      <AnimatePresence>
        {showStartup ? (
          <motion.div
            key="startup"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.1,
              pointerEvents: "none",
              transition: { duration: 0.6, ease: "easeInOut" },
            }}
          >
            <StartupSequence onComplete={() => setShowStartup(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            className="h-full w-full"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.19, 1, 0.22, 1],
              delay: 0.1,
            }}
          >
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <Launcher
                  onStartMeeting={handleStartMeeting}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
                <SettingsOverlay
                  isOpen={isSettingsOpen}
                  onClose={() => setIsSettingsOpen(false)}
                />
                <ToastViewport />
              </ToastProvider>
            </QueryClientProvider>
          </motion.div>
        )}
      </AnimatePresence>
      <UpdateBanner />
    </div>
  );
};

export default App;
