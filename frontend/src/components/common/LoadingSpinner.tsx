interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({ size = 'md', text = 'Chargement...', fullScreen = false }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-3',
    lg: 'h-16 w-16 border-4',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? 'min-h-screen' : 'p-8'}`}>
      <div className="relative">
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-primary-200 border-t-primary-600`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'} rounded-full bg-primary-600 animate-pulse`} />
        </div>
      </div>
      {text && (
        <p className="text-sm font-medium text-slate-500 animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;

