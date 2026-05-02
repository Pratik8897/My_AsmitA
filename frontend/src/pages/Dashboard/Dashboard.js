import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { getDashboardStats } from "../../services/dashboardService";
import Spinner from "../../components/ui/Spinner";
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

const loadingCards = () =>
  buildCards({
    totals: { users: null, societies: null, services: null },
    recent: { users: null, societies: null, services: null },
  });

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
  const skeletonCards = useMemo(() => loadingCards(), []);

  return (
    <AdminLayout title="Welcome to My Asmita Dashboard">
      {loading ? (
        <div className="stats-grid">
          {skeletonCards.map((card) => (
            <article key={card.title} className={`stat-card ${card.tone}`}>
              <div className={`stat-icon ${card.icon}`} />
              <div className="stat-body">
                <div className="flex items-center gap-2">
                  <p>{card.title}</p>
                  <Spinner size={16} className="border-white/40 border-t-white" />
                </div>
                <h2>—</h2>
                <span> </span>
              </div>
            </article>
          ))}
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
