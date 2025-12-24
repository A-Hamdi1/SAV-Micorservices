import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
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

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`rounded-xl border border-stroke bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '', children }: CardHeaderProps) => {
  // Si children est fourni, utiliser le contenu personnalisé
  if (children) {
    return (
      <div className={`border-b border-stroke px-6 py-4 ${className}`}>
        {children}
      </div>
    );
  }

  // Sinon, utiliser le format title/subtitle/action standard
  return (
    <div className={`flex items-center justify-between border-b border-stroke px-6 py-4 ${className}`}>
      <div>
        {title && <h3 className="text-lg font-semibold text-black">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-sm text-bodydark2">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardBody = ({ children, className = '' }: CardBodyProps) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export default Card;
