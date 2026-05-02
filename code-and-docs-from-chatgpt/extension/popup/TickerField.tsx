interface TickerFieldProps {
  detectedTicker: string | null;
  value: string;
  onChange: (v: string) => void;
  onUseDetected: () => void;
}

export function TickerField({ detectedTicker, value, onChange, onUseDetected }: TickerFieldProps) {
  return (
    <div>
      {detectedTicker && (
        <div>
          <span>Detected: {detectedTicker}</span>
          <button onClick={onUseDetected}>Use this</button>
        </div>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="KX..."
      />
    </div>
  );
}
