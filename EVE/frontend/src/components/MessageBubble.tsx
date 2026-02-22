import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const stripMarkers = (text: string) =>
  text.replace(/<<<\s*ACTION\s*:\s*\w+\s*>>>/g, "").trim();

const MessageBubble = ({ role, content, isStreaming }: MessageBubbleProps) => {
  const isUser = role === "user";
  const displayContent = isUser ? content : stripMarkers(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5 avatar-glow">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
      )}

      <div className="max-w-[85%]">
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? "bg-foreground text-white rounded-br-md"
              : "bg-muted/70 text-foreground rounded-bl-md"
          }`}
        >
          <div className="whitespace-pre-wrap">{displayContent}</div>
          {isStreaming && (
            <span className="inline-flex gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
