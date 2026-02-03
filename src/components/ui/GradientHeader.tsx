import React from 'react';

interface GradientHeaderProps {
  subtitle?: string;
  title: string;
  className?: string;
}

const GradientHeader: React.FC<GradientHeaderProps> = ({ subtitle, title, className = '' }) => (
  <section className={`gradient-header static z-10 w-full ${className}`}>
    <div className="container mx-auto px-6">
      <div className="public-profile-banner-content py-8">
        {subtitle && (
          <div className="public-profile-role text-white text-sm font-medium opacity-90 mb-2 font-barlow">{subtitle}</div>
        )}
        <div className="header-title public-profile-name text-white text-4xl font-extrabold font-barlow">{title}</div>
      </div>
    </div>
  </section>
);

export default GradientHeader; 