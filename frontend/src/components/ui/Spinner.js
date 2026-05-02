const Spinner = ({ size = 32, className = "" }) => {
  const px = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${className}`}
      style={{ width: px, height: px }}
      aria-label="Loading"
      role="status"
    />
  );
};

export default Spinner;

