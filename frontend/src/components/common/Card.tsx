import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '', hover = false }: CardProps) => {
  return (
    <div className={`rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50 ${hover ? 'hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/60 transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '', children }: CardHeaderProps) => {
  // Si children est fourni, utiliser le contenu personnalisé
  if (children) {
    return (
      <div className={`border-b border-slate-100 px-6 py-4 ${className}`}>
        {children}
      </div>
    );
  }

  // Sinon, utiliser le format title/subtitle/action standard
  return (
    <div className={`flex items-center justify-between border-b border-slate-100 px-6 py-4 ${className}`}>
      <div>
        {title && <h3 className="text-lg font-semibold text-slate-800">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardBody = ({ children, className = '' }: CardBodyProps) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export default Card;
