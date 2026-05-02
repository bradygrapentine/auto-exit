interface SizeFieldProps {
  detectedSize: number | null;
  ambiguous: boolean;
  value: string;
  onChange: (v: string) => void;
  onUseDetected: () => void;
}

export function SizeField({ detectedSize, ambiguous, value, onChange, onUseDetected }: SizeFieldProps) {
  return (
    <div>
      {detectedSize !== null && (
        <div>
          <span>Detected: {detectedSize}</span>
          <button onClick={onUseDetected}>Use this</button>
        </div>
      )}
      {ambiguous && <span>Ambiguous position size detected — enter manually</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="1"
      />
    </div>
  );
}
