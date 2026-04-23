import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Unauthorized from "../../pages/Auth/Unauthorized";
import {
  APP_SETTINGS_EVENT,
  getAppSettings,
} from "../../services/appSettingsService";
import { canAccessItem } from "../../services/accessControl";
import { isAuthenticated } from "../../services/authService";

const ProtectedRoute = ({ children, access }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      const nextSettings = await getAppSettings();

      if (isMounted) {
        setSettings(nextSettings);
        setLoading(false);
      }
    };

    loadSettings();
    window.addEventListener(APP_SETTINGS_EVENT, loadSettings);

    return () => {
      isMounted = false;
      window.removeEventListener(APP_SETTINGS_EVENT, loadSettings);
    };
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (loading || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
        Loading access...
      </div>
    );
  }

  if (!canAccessItem(access, settings)) {
    return <Unauthorized />;
  }

  return children;
};

export default ProtectedRoute;
