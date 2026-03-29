export function TypingIndicator() {
  return (
    <div className="flex gap-2 max-w-[80%] animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-muted flex items-center gap-1.5 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
    </div>
  );
}
