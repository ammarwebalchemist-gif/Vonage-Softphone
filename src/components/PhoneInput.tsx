interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export function PhoneInput({ value, onChange, disabled, error }: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = input.replace(/[^\d+\-\s()]/g, '');
    onChange(cleaned);
  };

  return (
    <div className="mb-6">
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Enter phone number"
        className={`w-full border-2 rounded-lg p-4 text-xl text-slate-800 placeholder-slate-400
          transition-all duration-200 outline-none
          ${disabled
            ? 'bg-slate-100 border-slate-200 cursor-not-allowed'
            : 'bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
          }
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}
        `}
      />
      {error ? (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">Format: +1234567890</p>
      )}
    </div>
  );
}
