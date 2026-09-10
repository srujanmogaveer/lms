import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Button } from '../ui/Button';

interface CallToActionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  title = 'Ready to Start Your Learning Journey?',
  subtitle = 'Join over 25,000+ students already mastering new skills on EduSphere LMS today.',
  buttonText = 'Explore Catalog Now',
  buttonLink = '/courses',
}) => {
  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 my-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 p-8 sm:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h2>
          <p className="text-brand-100 text-sm sm:text-base leading-relaxed">{subtitle}</p>
          <div className="pt-2">
            <Link to={buttonLink}>
              <Button size="lg" variant="secondary">
                {buttonText} <FiArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Subtle Decorative Background Spheres */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-48 h-48 bg-brand-400/20 rounded-full blur-xl pointer-events-none" />
      </div>
    </div>
  );
};
