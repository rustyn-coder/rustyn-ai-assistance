import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL, AUTH_STORAGE_KEYS } from "../config/api";

// ============================================
// Types
// ============================================
interface LoginPageProps {
  onLoginSuccess: (token: string, username: string) => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    tokenType: string;
    expiresIn: string;
    expiresAt: string;
    user: {
      username: string;
    };
  };
  errors?: string[];
}

// ============================================
// Constants (imported from config)
// ============================================
const TOKEN_STORAGE_KEY = AUTH_STORAGE_KEYS.TOKEN;
const USER_STORAGE_KEY = AUTH_STORAGE_KEYS.USER;
const EXPIRY_STORAGE_KEY = AUTH_STORAGE_KEYS.EXPIRY;

// ============================================
// Auth Helpers (exported for use in App.tsx)
// ============================================
export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(EXPIRY_STORAGE_KEY);
    if (!token || !expiry) return null;
    // Check if token is expired
    if (new Date(expiry) <= new Date()) {
      clearStoredAuth();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function getStoredUser(): string | null {
  try {
    return localStorage.getItem(USER_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(EXPIRY_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

function storeAuth(token: string, username: string, expiresAt: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, username);
    localStorage.setItem(EXPIRY_STORAGE_KEY, expiresAt);
  } catch {
    // Ignore storage errors
  }
}

export async function verifyStoredToken(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;
  try {
    // Route through Electron main process via IPC (renderer fetch may be blocked)
    if (window.electronAPI?.authVerify) {
      const data = await window.electronAPI.authVerify({ token });
      return data.success === true;
    }
    // Fallback to direct fetch (e.g. in browser dev)
    const res = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

// ============================================
// Floating Particle Background
// ============================================
const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.15 + 0.03,
  }));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: `${p.y}vh`,
            opacity: 0,
          }}
          animate={{
            x: [
              `${p.x}vw`,
              `${(p.x + 30) % 100}vw`,
              `${(p.x + 10) % 100}vw`,
              `${p.x}vw`,
            ],
            y: [
              `${p.y}vh`,
              `${(p.y + 20) % 100}vh`,
              `${(p.y - 15 + 100) % 100}vh`,
              `${p.y}vh`,
            ],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: `rgba(59, 130, 246, ${p.opacity + 0.1})`,
            boxShadow: `0 0 ${p.size * 4}px rgba(59, 130, 246, ${p.opacity})`,
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// Animated Logo
// ============================================
const AnimatedLogo: React.FC = () => {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
      }}
    >
      {/* Icon circle */}
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px rgba(59,130,246,0.15)",
            "0 0 40px rgba(59,130,246,0.25)",
            "0 0 20px rgba(59,130,246,0.15)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </motion.div>
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-system)",
          }}
        >
          Rustyn AI
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#737380",
            margin: "4px 0 0 0",
            fontFamily: "var(--font-system)",
            letterSpacing: "0.02em",
          }}
        >
          Sign in to continue
        </p>
      </div>
    </motion.div>
  );
};

// ============================================
// Login Page Component
// ============================================
const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState("");

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Auto-focus username on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      usernameRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Client-side validation
  const validate = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errors.username = "Username is required";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 3) {
      errors.password = "Password is too short";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle login submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validate()) return;

    setIsLoading(true);

    try {
      let data: LoginResponse;

      // Route through Electron main process via IPC (renderer fetch may be blocked)
      if (window.electronAPI?.authLogin) {
        data = await window.electronAPI.authLogin({
          username: username.trim(),
          password,
        });
      } else {
        // Fallback to direct fetch (e.g. in browser dev)
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        });
        data = await response.json();
      }

      if (data.success && data.data) {
        // Store token
        storeAuth(
          data.data.token,
          data.data.user.username,
          data.data.expiresAt,
        );

        setSuccessMessage("Login successful! Launching...");

        // Small delay for the success animation
        setTimeout(() => {
          onLoginSuccess(data.data!.token, data.data!.user.username);
        }, 800);
      } else {
        setError(
          data.message || "Login failed. Please check your credentials.",
        );
        // Shake the form
        setIsLoading(false);
      }
    } catch (err: any) {
      if (
        err.message?.includes("fetch") ||
        err.message?.includes("network") ||
        err.name === "TypeError"
      ) {
        setError("Please check your internet connection and try again.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
      setIsLoading(false);
    }
  };

  // Handle Enter key on inputs
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  // ============================================
  // Styles
  // ============================================
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(145deg, #0a0a0f 0%, #0d0d14 30%, #111118 60%, #0a0a10 100%)",
    fontFamily: "var(--font-system)",
    overflow: "hidden",
    zIndex: 9999,
  };

  const cardStyle: React.CSSProperties = {
    width: 380,
    padding: "40px 36px 36px",
    borderRadius: 20,
    background: "rgba(24, 24, 30, 0.85)",
    backdropFilter: "blur(40px) saturate(140%)",
    WebkitBackdropFilter: "blur(40px) saturate(140%)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    boxShadow: `
      0 0 0 1px rgba(0, 0, 0, 0.3),
      0 20px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 100px -20px rgba(59, 130, 246, 0.08)
    `,
    position: "relative",
  };

  const inputContainerStyle: React.CSSProperties = {
    position: "relative",
    marginBottom: 6,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "#8b8b96",
    marginBottom: 6,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  const inputStyle = (hasError: boolean): React.CSSProperties =>
    ({
      width: "100%",
      padding: "12px 14px",
      fontSize: 14,
      fontFamily: "var(--font-system)",
      color: "#e4e4e7",
      background: "rgba(255, 255, 255, 0.04)",
      border: `1px solid ${hasError ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.08)"}`,
      borderRadius: 12,
      outline: "none",
      transition: "all 0.2s ease",
      boxSizing: "border-box",
    }) as React.CSSProperties;

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 20px",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "var(--font-system)",
    color: "#ffffff",
    background: isLoading
      ? "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
      : successMessage
        ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
        : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    borderRadius: 12,
    cursor: isLoading ? "not-allowed" : "pointer",
    transition: "all 0.25s ease",
    position: "relative",
    overflow: "hidden",
    letterSpacing: "0.01em",
  };

  const errorFieldStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#ef4444",
    marginTop: 4,
    marginBottom: 4,
    minHeight: 16,
  };

  return (
    <div style={containerStyle}>
      <FloatingParticles />

      {/* Gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "15%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.7,
          ease: [0.19, 1, 0.22, 1],
          delay: 0.15,
        }}
        style={cardStyle}
      >
        {/* Top highlight line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)",
            borderRadius: 1,
          }}
        />

        <AnimatedLogo />

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 1 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span
                  style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.4 }}
                >
                  {error}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success banner */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span
                  style={{ fontSize: 13, color: "#6ee7b7", lineHeight: 1.4 }}
                >
                  {successMessage}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 4 }}
        >
          {/* Username */}
          <div style={inputContainerStyle}>
            <label style={labelStyle}>Username</label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#52525b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username)
                    setFieldErrors((p) => ({ ...p, username: undefined }));
                  if (error) setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter your username"
                autoComplete="username"
                disabled={isLoading || !!successMessage}
                style={{
                  ...inputStyle(!!fieldErrors.username),
                  paddingLeft: 40,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = fieldErrors.username
                    ? "rgba(239, 68, 68, 0.5)"
                    : "rgba(59, 130, 246, 0.4)";
                  e.target.style.background = "rgba(255, 255, 255, 0.06)";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(59, 130, 246, 0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldErrors.username
                    ? "rgba(239, 68, 68, 0.5)"
                    : "rgba(255, 255, 255, 0.08)";
                  e.target.style.background = "rgba(255, 255, 255, 0.04)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
            <div style={errorFieldStyle}>{fieldErrors.username || ""}</div>
          </div>

          {/* Password */}
          <div style={inputContainerStyle}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#52525b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors((p) => ({ ...p, password: undefined }));
                  if (error) setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading || !!successMessage}
                style={{
                  ...inputStyle(!!fieldErrors.password),
                  paddingLeft: 40,
                  paddingRight: 44,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = fieldErrors.password
                    ? "rgba(239, 68, 68, 0.5)"
                    : "rgba(59, 130, 246, 0.4)";
                  e.target.style.background = "rgba(255, 255, 255, 0.06)";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(59, 130, 246, 0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldErrors.password
                    ? "rgba(239, 68, 68, 0.5)"
                    : "rgba(255, 255, 255, 0.08)";
                  e.target.style.background = "rgba(255, 255, 255, 0.04)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {/* Show/hide password toggle */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  opacity: 0.4,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.opacity = "0.8";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.opacity = "0.4";
                }}
              >
                {showPassword ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a1a1aa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a1a1aa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div style={errorFieldStyle}>{fieldErrors.password || ""}</div>
          </div>

          {/* Login Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !!successMessage}
            style={buttonStyle}
            whileHover={
              !isLoading && !successMessage
                ? {
                    scale: 1.01,
                    boxShadow: "0 8px 30px -8px rgba(59,130,246,0.4)",
                  }
                : {}
            }
            whileTap={!isLoading && !successMessage ? { scale: 0.98 } : {}}
          >
            {/* Button shimmer effect */}
            {!isLoading && !successMessage && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)",
                  animation: "shine 3s infinite",
                }}
              />
            )}

            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#ffffff",
                    borderRadius: "50%",
                  }}
                />
                <span>Authenticating...</span>
              </div>
            ) : successMessage ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
                <span>Success!</span>
              </div>
            ) : (
              <span style={{ position: "relative", zIndex: 1 }}>Sign In</span>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 11,
            color: "#3f3f46",
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3f3f46"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secured with JWT authentication</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
