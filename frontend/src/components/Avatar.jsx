function Avatar({ name, size = "md" }) {
  const sizeClasses = {
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-forest flex-shrink-0 flex items-center justify-center font-heading font-bold text-white`}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;