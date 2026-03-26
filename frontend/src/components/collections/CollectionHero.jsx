import React from 'react';

export default function CollectionHero({ title, description, coverImage }) {
  return (
    <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center bg-surface-container overflow-hidden">
      {coverImage && (
        <img 
          src={coverImage} 
          alt={title} 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply"
        />
      )}
      <div className="relative z-10 text-center px-8 flex flex-col items-center max-w-3xl">
        <span className="label-sm mb-4">New Season</span>
        <h1 className="display-lg text-primary mb-6 drop-shadow-sm">{title}</h1>
        <p className="body-md text-primary/80 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}
