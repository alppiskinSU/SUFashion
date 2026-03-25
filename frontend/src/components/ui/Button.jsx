import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) {
  const baseStyles = "text-sm uppercase tracking-[0.2em] font-bold py-5 px-8 transition-all duration-500 active:scale-[0.98] outline-none flex items-center justify-center gap-2 rounded-none";
  
  const variants = {
    primary: "bg-primary text-white hover:brightness-95",
    secondary: "bg-secondary-container text-on-secondary-container hover:brightness-95",
    ghost: "bg-transparent border border-outline hover:bg-surface-container-high text-primary",
    white: "bg-white text-primary hover:bg-stone-100"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
