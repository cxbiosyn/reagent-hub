const { useState, useEffect, useRef } = window.PreactHooks;
export function QuantityStepper({ quantity, onChange, min = 0, max = 9999 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(quantity));
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDecrement = () => { if (quantity > min) onChange(quantity - 1); };
  const handleIncrement = () => { if (quantity < max) onChange(quantity + 1); };
  const handleStartEdit = () => { setEditValue(String(quantity)); setIsEditing(true); };
  const handleConfirm = () => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val >= min && val <= max) onChange(val);
    setIsEditing(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') setIsEditing(false);
  };

  return window.html`
    <div class="flex items-center gap-1">
      <button onClick=${handleDecrement} disabled=${quantity <= min}
        class="stepper-btn w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${quantity <= min ? 'bg-gray-300' : 'bg-red-500 hover:bg-red-600 shadow-sm'}"
        title="减少">−</button>
      ${isEditing ? window.html`
        <input ref=${inputRef} type="number" value=${editValue}
          onInput=${e => setEditValue(e.target.value)}
          onBlur=${handleConfirm} onKeyDown=${handleKeyDown}
          class="w-14 h-8 text-center font-semibold text-primary border-2 border-primary rounded-lg outline-none text-sm"
          min=${min} max=${max} />
      ` : window.html`
        <button onClick=${handleStartEdit}
          class="w-14 h-8 text-center font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors cursor-text select-none"
          title="点击直接输入数量">${quantity}</button>
      `}
      <button onClick=${handleIncrement} disabled=${quantity >= max}
        class="stepper-btn w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${quantity >= max ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700 shadow-sm'}"
        title="增加">+</button>
    </div>
  `;
}
