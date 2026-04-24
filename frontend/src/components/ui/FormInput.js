const FormInput = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  error,
  disabled = false,
  required = false,
  textarea = false,
  maxLength,
}) => {
  const baseClass =
    "w-full px-3 py-2 border rounded-md outline-none transition";

  const normalClass = "border-gray-300 focus:border-blue-500";
  const errorClass = "border-red-500 bg-red-50";

  const inputClass = `${baseClass} ${error ? errorClass : normalClass}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClass}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={inputClass}
        />
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

export default FormInput;