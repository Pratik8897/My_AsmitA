const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  maxLength,
  className = "",
  containerClassName = "",
  error = "",
  name,
}) => {
  const baseClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500";

  const errorClass = error ? "border-red-500 bg-red-50 focus:border-red-500" : "";

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`.trim()}>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`${baseClass} ${errorClass} ${className}`.trim()}
      />
      {!!error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
