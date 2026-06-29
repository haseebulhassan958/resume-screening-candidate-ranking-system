function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gold-soft flex items-center justify-center text-3xl mb-2">
        {icon}
      </div>
      <h3 className="font-heading text-base font-bold text-text-hi">{title}</h3>
      <p className="text-text-lo text-sm max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export default EmptyState;