import React from 'react';

export default function Input({ label, id, type = 'text', className = '', indicator = null, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <input 
        id={id} 
        type={type} 
        placeholder=" " 
        className="peer w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 focus:ring-0 focus:border-primary transition-colors text-primary outline-none" 
        {...props} 
      />
      <label 
        htmlFor={id} 
        className="absolute left-0 top-2 text-outline font-label text-xs uppercase tracking-widest transition-all duration-300 cursor-text pointer-events-none origin-left 
          peer-focus:-translate-y-6 peer-focus:scale-85 peer-focus:text-primary 
          peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-85 peer-[:not(:placeholder-shown)]:text-primary"
      >
        {label}
      </label>
      {indicator}
    </div>
  );
}
