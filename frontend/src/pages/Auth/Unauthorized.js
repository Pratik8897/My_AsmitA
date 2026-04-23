import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";

const Unauthorized = () => {
  return (
    <AdminLayout title="Access Restricted">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        <h2 className="text-xl font-semibold">
          You do not have access to this page.
        </h2>
        <p className="mt-2 text-sm">
          Your current role does not include permission for this section.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </AdminLayout>
  );
};

export default Unauthorized;
