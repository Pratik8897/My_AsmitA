const Dropdown = ({
  value,
  onChange,
  options = [],
  disabled = false,
  className = "",
  name,
}) => {
  const normalized = options.map((opt) => {
    if (opt && typeof opt === "object") return opt;
    return { label: String(opt), value: opt };
  });

  return (
    <select
      name={name}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange && onChange(e.target.value)}
      className={`border border-gray-300 rounded-lg text-sm bg-white text-gray-700 outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 ${className}`.trim()}
    >
      {normalized.map((opt, i) => (
        <option key={opt.value ?? i} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default Dropdown;

