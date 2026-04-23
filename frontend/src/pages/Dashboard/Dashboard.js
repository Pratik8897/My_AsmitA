import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { getDashboardStats } from "../../services/dashboardService";
import "./Dashboard.css";

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN").format(value);
};

const recentTrend = (value) =>
  value === null
    ? "Not available without a timestamp column"
    : `${formatValue(value)} added in last 30 days`;

const buildCards = (stats) => [
  {
    title: "Total Users",
    value: formatValue(stats?.totals?.users),
    trend: recentTrend(stats?.recent?.users),
    tone: "red",
    icon: "user",
  },
  {
    title: "Total Societies",
    value: formatValue(stats?.totals?.societies),
    trend: recentTrend(stats?.recent?.societies),
    tone: "blue",
    icon: "society",
  },
  {
    title: "Total Services",
    value: formatValue(stats?.totals?.services),
    trend: recentTrend(stats?.recent?.services),
    tone: "mint",
    icon: "service",
  },
  {
    title: "New Users",
    value: formatValue(stats?.recent?.users),
    trend: "Created in the last 30 days",
    tone: "green",
    icon: "user",
  },
  {
    title: "New Societies",
    value: formatValue(stats?.recent?.societies),
    trend: "Created in the last 30 days",
    tone: "amber",
    icon: "society",
  },
  {
    title: "New Services",
    value: formatValue(stats?.recent?.services),
    trend: "Created in the last 30 days",
    tone: "purple",
    icon: "service",
  },
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const data = await getDashboardStats();

        if (isMounted) {
          setStats(data);
          setError("");
        }
      } catch (loadError) {
        console.error(loadError);
        if (isMounted) {
          setError("Unable to load dashboard data right now.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = useMemo(() => buildCards(stats), [stats]);

  return (
    <AdminLayout title="Welcome to My Asmita Dashboard">
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Loading dashboard data...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      ) : (
        <div className="stats-grid">
          {statCards.map((card) => (
            <article key={card.title} className={`stat-card ${card.tone}`}>
              <div className={`stat-icon ${card.icon}`} />
              <div className="stat-body">
                <p>{card.title}</p>
                <h2>{card.value}</h2>
                <span>{card.trend}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
