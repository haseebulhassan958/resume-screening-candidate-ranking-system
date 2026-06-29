function Spinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-border-soft border-t-forest rounded-full animate-spin" />
      <p className="text-text-lo text-sm font-medium">{message}</p>
    </div>
  );
}

export default Spinner;