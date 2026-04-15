const Button = ({ children, variant = "primary", ...props }) => {
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    outline: "border border-gray-300 text-gray-700 dark:text-white",
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm shadow-sm ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;