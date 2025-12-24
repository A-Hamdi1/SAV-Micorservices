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
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  };

  const iconBgClasses = {
    primary: 'bg-primary-50',
    success: 'bg-green-50',
    warning: 'bg-amber-50',
    danger: 'bg-red-50',
    info: 'bg-blue-50',
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-card hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-bodydark2">{title}</p>
          <h4 className="mt-2 text-2xl font-bold text-black">{value}</h4>
          
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`flex items-center gap-0.5 text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {trend.value}%
              </span>
              <span className="text-xs text-bodydark2">vs mois dernier</span>
            </div>
          )}
        </div>
        
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${iconBgClasses[color]}`}>
          <div className={`${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
