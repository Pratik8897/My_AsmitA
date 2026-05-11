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

const MobileResidentHome = () => {
  return (
    <MobileLayout title="Home">
      <div className="space-y-3">
        <Card
          title="Pre-Approved Invites"
          subtitle="Create a pass for guest/cab/delivery and share pass code/QR."
        />
        <Card
          title="Visitor Requests"
          subtitle="Approve/reject visitors requested by guard."
        />
        <Card
          title="Notifications (Demo)"
          subtitle="Real-time alerts can be added later (socket/push)."
        />
      </div>
    </MobileLayout>
  );
};

export default MobileResidentHome;

