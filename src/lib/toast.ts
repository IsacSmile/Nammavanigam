import toast from "react-hot-toast";

/**
 * Show a success toast on login.
 * Message: "Welcome back, [name]!"
 */
export const showLoginSuccessToast = (userName?: string | null) => {
  const message = userName ? `Welcome back, ${userName}!` : "Welcome back!";
  toast.success(message, {
    duration: 3000,
    style: {
      background: "#1A8A2E",
      color: "#ffffff",
      fontWeight: "bold",
      borderRadius: "12px",
      fontSize: "13px",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#1A8A2E",
    },
  });
};

/**
 * Show a neutral/info toast on logout.
 * Message: "You've been signed out"
 */
export const showLogoutToast = () => {
  toast("You've been signed out", {
    duration: 3000,
    icon: "ℹ️",
    style: {
      background: "#1E293B",
      color: "#ffffff",
      fontWeight: "600",
      borderRadius: "12px",
      fontSize: "13px",
    },
  });
};

/**
 * Show an error toast on failed login.
 * Message: "Invalid email or password" (or custom message)
 */
export const showLoginErrorToast = (customMessage?: string | null) => {
  toast.error(customMessage || "Invalid email or password", {
    duration: 3000,
    style: {
      background: "#DC2626",
      color: "#ffffff",
      fontWeight: "600",
      borderRadius: "12px",
      fontSize: "13px",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#DC2626",
    },
  });
};

/**
 * Show a success toast on account registration.
 * Message: "Account created successfully!"
 */
export const showRegisterSuccessToast = () => {
  toast.success("Account created successfully!", {
    duration: 3000,
    style: {
      background: "#1A8A2E",
      color: "#ffffff",
      fontWeight: "bold",
      borderRadius: "12px",
      fontSize: "13px",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#1A8A2E",
    },
  });
};
