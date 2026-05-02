import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Unauthorized from "../../pages/Auth/Unauthorized";
import {
  APP_SETTINGS_EVENT,
  getCachedAppSettings,
  getAppSettings,
} from "../../services/appSettingsService";
import { canAccessItem } from "../../services/accessControl";
import { isAuthenticated } from "../../services/authService";
import Spinner from "../ui/Spinner";

const ProtectedRoute = ({ children, access }) => {
  const [settings, setSettings] = useState(() => getCachedAppSettings());
  const [loading, setLoading] = useState(() => !getCachedAppSettings());

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      if (getCachedAppSettings()) {
        if (isMounted) {
          setSettings(getCachedAppSettings());
          setLoading(false);
        }
        return;
      }

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
        <Spinner />
      </div>
    );
  }

  if (!canAccessItem(access, settings)) {
    return <Unauthorized />;
  }

  return children;
};

export default ProtectedRoute;
