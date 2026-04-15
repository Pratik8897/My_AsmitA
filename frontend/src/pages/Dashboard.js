import AdminLayout from "../layouts/AdminLayout";
import "./Dashboard.css";

const statCards = [
  {
    title: "Total Users",
    value: "5k+",
    trend: "Increased by 60%",
    tone: "red",
    icon: "user",
  },
  {
    title: "Total Societies",
    value: "20",
    trend: "Increased by 60%",
    tone: "blue",
    icon: "society",
  },
  {
    title: "Total Services",
    value: "53",
    trend: "Increased by 60%",
    tone: "mint",
    icon: "service",
  },
  {
    title: "New Users",
    value: "2k+",
    trend: "Signup in last 30 days",
    tone: "green",
    icon: "user",
  },
  {
    title: "New Societies",
    value: "5",
    trend: "Added in last 30 days",
    tone: "amber",
    icon: "society",
  },
  {
    title: "New Services",
    value: "7",
    trend: "Added in last 30 days",
    tone: "purple",
    icon: "service",
  },
];

const Dashboard = () => {
  return (
    <AdminLayout title="Welcome to My Asmita Dashboard">
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
    </AdminLayout>
  );
};

export default Dashboard;
