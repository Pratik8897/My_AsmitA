import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import ContactUs from "../pages/AboutUs/ContactUs";
import AboutUs from "../pages/AboutUs/AboutUs.js";
import AddAmenity from "../pages/Amenities/AddAmenity.js";
import Amenities from "../pages/Amenities/Amenities.js";
import Dashboard from "../pages/Dashboard/Dashboard";
import Login from "../pages/Dashboard/Login.js";
import Faq from "../pages/FAQ/AddFaq.js";
import AddParkingSlot from "../pages/Parking/AddParkingSlot.js";
import AssignParkingSlot from "../pages/Parking/AssignParkingSlot.js";
import ParkingManagement from "../pages/Parking/ParkingManagement.js";
import PrivacyPolicy from "../pages/legal/PrivacyPolicy.js";
import TermsConditions from "../pages/legal/TermsConditions.js";
import AddService from "../pages/ServicesProvider/AddService.js";
import AddServicesProvider from "../pages/ServicesProvider/AddServicesProvider.js";
import ServiceUsed from "../pages/ServicesProvider/ServiceUsed.js";
import Services from "../pages/ServicesProvider/Services.js";
import ServicesProviders from "../pages/ServicesProvider/ServicesProviders.js";
import Settings from "../pages/Settings/Settings";
import AddSociety from "../pages/Society/AddSociety.js";
import FloorSummary from "../pages/Society/FloorSummary.js";
import SocietyAdmin from "../pages/Society/SocietyAdmin.js";
import SocietyManagement from "../pages/Society/SocietyManagement.js";
import Support from "../pages/SupportTicket/Support.js";
import AddAdmin from "../pages/User/AddAdmin";
import AddUser from "../pages/User/AddUser";
import UserManagement from "../pages/User/UserManagement";
import TowerManagement from "../pages/Tower/TowerManagement";
import UnitManagement from "../pages/Unit/UnitManagement";

const withProtection = (element, access = {}) => (
  <ProtectedRoute access={access}>{element}</ProtectedRoute>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={withProtection(<Dashboard />)} />
        <Route
          path="/user-management"
          element={withProtection(<UserManagement />, {
            roles: ["admin", "super-admin", "society-admin", "society-manager"],
            permission: "canManageUsers",
          })}
        />
        <Route
          path="/add-user"
          element={withProtection(<AddUser />, {
            roles: ["admin", "super-admin", "society-admin", "society-manager"],
            permission: "canManageUsers",
          })}
        />
        <Route
          path="/add-admin"
          element={withProtection(<AddAdmin />, {
            roles: ["admin", "super-admin"],
          })}
        />
        <Route
          path="/add-service"
          element={withProtection(<AddService />, {
            roles: ["admin", "super-admin", "society-admin", "society-manager"],
          })}
        />
        <Route
          path="/add-service-provider"
          element={withProtection(<AddServicesProvider />, {
            roles: ["admin", "super-admin", "society-admin", "society-manager"],
          })}
        />
        <Route
          path="/society-management"
          element={withProtection(<SocietyManagement />, {
            roles: ["admin", "super-admin", "society-admin"],
            permission: "canManageSocieties",
          })}
        />
        <Route
          path="/add-society"
          element={withProtection(<AddSociety />, {
            roles: ["admin", "super-admin", "society-admin"],
            permission: "canManageSocieties",
          })}
        />
        <Route
          path="/society-admin"
          element={withProtection(<SocietyAdmin />, {
            roles: ["admin", "super-admin", "society-admin"],
            permission: "canManageUsers",
          })}
        />
        <Route
          path="/services"
          element={withProtection(<Services />, {
            roles: ["admin", "super-admin", "society-admin", "society-manager"],
          })}
        />
        <Route
          path="/services-providers"
          element={withProtection(<ServicesProviders />, {
            roles: ["admin", "super-admin", "society-admin", "society-manager"],
          })}
        />
        <Route
          path="/service-used"
          element={withProtection(<ServiceUsed />, {
            roles: ["admin", "super-admin", "society-admin", "society-manager"],
          })}
        />
        <Route
          path="/floor-summary"
          element={withProtection(<FloorSummary />, {
            roles: ["admin", "super-admin", "society-admin", "society-manager"],
          })}
        />
        <Route
          path="/tower-management"
          element={withProtection(<TowerManagement />, {
            roles: ["admin", "super-admin", "society-admin"],
          })}
        />
        <Route
          path="/unit-management"
          element={withProtection(<UnitManagement />, {
            roles: ["admin", "super-admin", "society-admin"],
          })}
        />
        <Route
          path="/amenities"
          element={withProtection(<Amenities />, {
            roles: [
              "admin",
              "super-admin",
              "society-admin",
              "society-manager",
              "maintenance-staff",
            ],
            permission: "canManageAmenities",
          })}
        />
        <Route
          path="/add-amenity"
          element={withProtection(<AddAmenity />, {
            roles: [
              "admin",
              "super-admin",
              "society-admin",
              "society-manager",
              "maintenance-staff",
            ],
            permission: "canManageAmenities",
          })}
        />
        <Route
          path="/parking-management"
          element={withProtection(<ParkingManagement />, {
            roles: [
              "admin",
              "super-admin",
              "society-admin",
              "society-manager",
              "security-guard",
            ],
          })}
        />
        <Route
          path="/add-parking-slot"
          element={withProtection(<AddParkingSlot />, {
            roles: [
              "admin",
              "super-admin",
              "society-admin",
              "society-manager",
              "security-guard",
            ],
          })}
        />
        <Route
          path="/assign-parking-slot"
          element={withProtection(<AssignParkingSlot />, {
            roles: [
              "admin",
              "super-admin",
              "society-admin",
              "society-manager",
              "security-guard",
            ],
          })}
        />
        <Route
          path="/support"
          element={withProtection(<Support />, {
            roles: [
              "admin",
              "super-admin",
              "society-admin",
              "society-manager",
              "help-desk",
              "security-guard",
            ],
          })}
        />
        <Route
          path="/settings"
          element={withProtection(<Settings />, {
            roles: ["admin", "super-admin"],
          })}
        />
        <Route
          path="/add-faq"
          element={withProtection(<Faq />, {
            roles: ["admin", "super-admin"],
          })}
        />
        <Route path="/about-us" element={withProtection(<AboutUs />)} />
        <Route path="/contact-us" element={withProtection(<ContactUs />)} />
        <Route
          path="/terms-conditions"
          element={withProtection(<TermsConditions />)}
        />
        <Route
          path="/privacy-policy"
          element={withProtection(<PrivacyPolicy />)}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
