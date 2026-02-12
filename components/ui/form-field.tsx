import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormFieldProps {
  type?: string;
  placeholder?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export default function FormField({
  type = "text",
  placeholder,
  label,
  value,
  onChange,
  required = false,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="form-floating mb-3 floating-custom-label position-relative">
      <input
        type={inputType}
        className="form-control py-3"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
      />
      <label>{label}</label>
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="position-absolute end-0 top-50 translate-middle-y me-3 p-0"
          style={{ zIndex: 5 }}
        >
          {showPassword ? <EyeOff size={20} color="gray"/> : <Eye size={20} color="gray"/>}
        </button>
      )}
    </div>
  );
}