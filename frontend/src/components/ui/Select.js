const Select = ({ options = [], onChange, label }) => {
  return (
    <select
      className="border px-3 py-2 rounded-lg text-sm"
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {options.map((opt, i) => (
        <option key={i} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
};

export default Select;