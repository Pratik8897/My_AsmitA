// src/utils/validators.js

export const isRequired = (value) =>
  value && value.toString().trim() !== "";

export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isMobile = (value) =>
  /^[6-9]\d{9}$/.test(value);

export const isPincode = (value) =>
  /^\d{6}$/.test(value);

// Google Maps URL (basic)
export const isGoogleMapUrl = (value) =>
  /^https?:\/\/(www\.)?google\.[a-z.]+\/maps/.test(value);

// Latitude: -90 to 90
export const isLatitude = (value) => {
  if (!value) return true; // optional
  const num = parseFloat(value);
  return !isNaN(num) && num >= -90 && num <= 90;
};

// Longitude: -180 to 180
export const isLongitude = (value) => {
  if (!value) return true; // optional
  const num = parseFloat(value);
  return !isNaN(num) && num >= -180 && num <= 180;
};