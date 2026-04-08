import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import UserManagement from "../pages/UserManagement";
import AddUser from "../pages/AddUser";
import SocietyManagement from "../pages/SocietyManagement";
import SocietyAdmin from "../pages/SocietyAdmin";
import Services from "../pages/Services";
import ServicesProviders from "../pages/ServicesProviders";
import ServiceUsed from "../pages/ServiceUsed";
import FloorSummary from "../pages/FloorSummary";
import Ads from "../pages/Ads";
import Amenities from "../pages/Amenities";
import Booking from "../pages/Booking";
import ParkingManagement from "../pages/ParkingManagement";
import Support from "../pages/Support";
import AboutUs from "../pages/AboutUs";
import ContactUs from "../pages/ContactUs";
import TermsConditions from "../pages/TermsConditions";
import PrivacyPolicy from "../pages/PrivacyPolicy";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/society-management" element={<SocietyManagement />} />
        <Route path="/society-admin" element={<SocietyAdmin />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services-providers" element={<ServicesProviders />} />
        <Route path="/service-used" element={<ServiceUsed />} />
        <Route path="/floor-summary" element={<FloorSummary />} />
        <Route path="/ads" element={<Ads />} />
        <Route path="/amenities" element={<Amenities />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/parking-management" element={<ParkingManagement />} />
        <Route path="/support" element={<Support />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
