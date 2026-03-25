import React from 'react';
import Button from '../ui/Button';

export default function HeroSection() {
  return (
    <section className="relative w-full h-auto min-h-[90vh] bg-surface flex flex-col justify-center items-center px-8 overflow-hidden pt-24 pb-32">
      {/* Decorative Accent Element using the new #FFDE59 Secondary color */}
      <div className="absolute top-0 right-[-10vw] w-1/2 h-full bg-secondary-container/20 -skew-x-12 transform origin-top-right transition-transform duration-[2s] hover:skew-x-0"></div>
      
      {/* Editorial typography layout matching #2B2B2B and #EDEAE9 theme */}
      <div className="relative z-10 text-center text-primary max-w-6xl mx-auto flex flex-col items-center">
        <span className="uppercase tracking-[0.4em] text-sm md:text-base mb-8 block font-medium font-sans text-outline">
          Spring / Summer 2024
        </span>
        
        <h1 className="text-6xl md:text-[8rem] lg:text-[11rem] font-serif tracking-tighter leading-[0.85] mb-12">
          New <br className="hidden md:block"/>
          <span className="italic font-light text-primary/90">Season</span>
        </h1>
        
        <p className="text-lg md:text-xl font-sans text-outline max-w-2xl text-center mb-16 leading-relaxed">
          Curating a digital gallery where the soul of the runway meets the precision of modern design. The Digital Atelier redefined.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <Button variant="primary" className="px-12 py-5 text-sm md:text-base tracking-[0.25em]">
            Discover Atelier
          </Button>
          <Button variant="ghost" className="px-12 py-5 text-sm md:text-base tracking-[0.25em] border-primary text-primary hover:bg-primary hover:text-white">
            View Lookbook
          </Button>
        </div>
      </div>
    </section>
  );
}
