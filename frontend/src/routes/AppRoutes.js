import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Dashboard/Login.js";
import Dashboard from "../pages/Dashboard/Dashboard";
import UserManagement from "../pages/User/UserManagement";
import AddUser from "../pages/User/AddUser";
import AddSociety from "../pages/Society/AddSociety.js";
import AddAdmin from "../pages/User/AddAdmin";
import AddService from "../pages/ServicesProvider/AddService.js";
import AddServicesProvider  from "../pages/ServicesProvider/AddServicesProvider.js";
import SocietyManagement from "../pages/Society/SocietyManagement.js";
import SocietyAdmin from "../pages/Society/SocietyAdmin.js";
import Services from "../pages/ServicesProvider/Services.js";
import ServicesProviders from "../pages/ServicesProvider/ServicesProviders.js";
import ServiceUsed from "../pages/ServicesProvider/ServiceUsed.js";
import FloorSummary from "../pages/Society/FloorSummary.js";
// import Ads from "../pages/Ads";
// import AddAds from "../pages/AddAds";
import AddAmenity from "../pages/Amenities/AddAmenity.js";
import Amenities from "../pages/Amenities/Amenities.js";
// import Booking from "../pages/Booking";
import ParkingManagement from "../pages/Parking/ParkingManagement.js";
import AddParkingSlot from "../pages/Parking/AddParkingSlot.js";
import AssignParkingSlot from "../pages/Parking/AssignParkingSlot.js";
import Support from "../pages/SupportTicket/Support.js";
import Settings from "../pages/Settings/Settings";
import Faq from "../pages/FAQ/AddFaq.js";
import AboutUs from "../pages/AboutUs/AboutUs.js";
import ContactUs from "../pages/AboutUs/ContactUs";
import TermsConditions from "../pages/legal/TermsConditions.js";
import PrivacyPolicy from "../pages/legal/PrivacyPolicy.js";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/add-admin" element={<AddAdmin />} />
        <Route path="/add-service" element={<AddService />} />
        <Route path="/add-service-provider" element={<AddServicesProvider />} />
        <Route path="/society-management" element={<SocietyManagement />} />
        <Route path="/add-society" element={<AddSociety />} />
        <Route path="/society-admin" element={<SocietyAdmin />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services-providers" element={<ServicesProviders />} />
        <Route path="/service-used" element={<ServiceUsed />} />
        <Route path="/floor-summary" element={<FloorSummary />} />
        {/* <Route path="/add-ads" element={<AddAds />} />
        <Route path="/ads" element={<Ads />} /> */}
        <Route path="/amenities" element={<Amenities />} />
        <Route path="/add-amenity" element={<AddAmenity />} />
        {/* <Route path="/booking" element={<Booking />} /> */}
        <Route path="/parking-management" element={<ParkingManagement />} />
        <Route path="/add-parking-slot" element={<AddParkingSlot />} />
        <Route path="/assign-parking-slot" element={<AssignParkingSlot />} />
        <Route path="/support" element={<Support />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/add-faq" element={<Faq />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
