import MobileLayout from "./MobileLayout";

const Card = ({ title, subtitle }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
      {title}
    </div>
    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {subtitle}
    </div>
  </div>
);

const MobileGuardHome = () => {
  return (
    <MobileLayout title="Home">
      <div className="space-y-3">
        <Card
          title="Gate Invites"
          subtitle="Search pass/QR/mobile and allow/deny entry."
        />
        <Card
          title="Visitor Register"
          subtitle="Create visitor entry requests and check-in/out."
        />
        <Card
          title="Gate Logs (Admin)"
          subtitle="Admins can audit allowed/denied entries."
        />
      </div>
    </MobileLayout>
  );
};

export default MobileGuardHome;

