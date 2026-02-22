import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  variant?: "landing" | "compact";
}

const InputBar = ({ onSend, disabled = false, placeholder, variant = "compact" }: InputBarProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (variant === "landing") {
    return (
      <div className="relative">
        <div className="bg-white rounded-2xl shadow-lg shadow-black/[0.06] border border-border/80 overflow-hidden input-glow transition-all duration-300">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Describe the AI you want to build..."}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-foreground px-5 py-4 pr-14 resize-none outline-none placeholder:text-muted-foreground/70 text-[15px] font-sans disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:brightness-110 transition-all animate-pulse-glow"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type a message..."}
        disabled={disabled}
        rows={1}
        className="w-full bg-muted/60 text-foreground rounded-xl px-4 py-2.5 pr-11 resize-none outline-none placeholder:text-muted-foreground text-sm font-sans disabled:opacity-50 border border-transparent focus:border-primary/40 transition-all duration-200 focus:shadow-[0_0_12px_rgba(234,179,8,0.12)]"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:brightness-110 transition-all"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default InputBar;
