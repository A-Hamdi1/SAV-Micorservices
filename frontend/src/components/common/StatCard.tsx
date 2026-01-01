import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const StatCard = ({ title, value, icon, trend, color = 'primary' }: StatCardProps) => {
  const colorClasses = {
    primary: 'text-primary-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-sky-600',
  };

  const iconBgClasses = {
    primary: 'bg-gradient-to-br from-primary-100 to-primary-50',
    success: 'bg-gradient-to-br from-emerald-100 to-emerald-50',
    warning: 'bg-gradient-to-br from-amber-100 to-amber-50',
    danger: 'bg-gradient-to-br from-red-100 to-red-50',
    info: 'bg-gradient-to-br from-sky-100 to-sky-50',
  };

  const borderAccentClasses = {
    primary: 'border-l-primary-500',
    success: 'border-l-emerald-500',
    warning: 'border-l-amber-500',
    danger: 'border-l-red-500',
    info: 'border-l-sky-500',
  };

  return (
    <div className={`rounded-2xl border border-slate-200/60 border-l-4 ${borderAccentClasses[color]} bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h4 className="mt-2 text-3xl font-bold text-slate-800">{value}</h4>
          
          {trend && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-sm font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                  </svg>
                )}
                {trend.value}%
              </span>
              <span className="text-xs text-slate-400">vs mois dernier</span>
            </div>
          )}
        </div>
        
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBgClasses[color]}`}>
          <div className={`${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
