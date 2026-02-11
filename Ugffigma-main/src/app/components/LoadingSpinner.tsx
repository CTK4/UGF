export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-12 h-12">
        <div 
          className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{ 
            borderTopColor: 'var(--accent-primary)',
            borderRightColor: 'var(--accent-primary)',
          }}
        />
      </div>
    </div>
  );
}
