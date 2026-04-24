import {
  isRequired,
  isEmail,
  isMobile,
  isPincode,
  isGoogleMapUrl,
  isLatitude,
  isLongitude,
} from "./validators";

export const societyValidationRules = {
  society_name: [
    { validate: isRequired, message: "Society name is required" },
  ],

  city: [
    { validate: isRequired, message: "City is required" },
  ],

  contact_number: [
    { validate: isRequired, message: "Contact number required" },
    { validate: isMobile, message: "Invalid mobile number" },
  ],

  contact_email: [
    {
      validate: (val) => !val || isEmail(val),
      message: "Invalid email",
    },
  ],

  pincode: [
    {
      validate: (val) => !val || isPincode(val),
      message: "Invalid pincode",
    },
  ],

  google_map_url: [
    {
      validate: (val) => !val || isGoogleMapUrl(val),
      message: "Invalid Google Maps URL",
    },
  ],

  latitude: [
    {
      validate: isLatitude,
      message: "Latitude must be between -90 and 90",
    },
  ],

  longitude: [
    {
      validate: isLongitude,
      message: "Longitude must be between -180 and 180",
    },
  ],
};