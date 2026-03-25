import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface-container-low w-full py-20 px-12 border-t-0">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto">
        <div>
          <img src="/sufashion-logo-w.svg" alt="SUFashion Logo" className="h-12 mb-8" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-outline leading-loose">
            Defining modern luxury through meticulous craft and editorial vision since 2012.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="font-sans text-xs uppercase tracking-widest font-bold text-primary mb-2">Collections</h4>
          <Link to="/" className="font-sans text-xs uppercase tracking-widest font-medium text-outline hover:text-primary transition-colors duration-300">New Arrivals</Link>
          <Link to="/" className="font-sans text-xs uppercase tracking-widest font-medium text-outline hover:text-primary transition-colors duration-300">Menswear</Link>
          <Link to="/" className="font-sans text-xs uppercase tracking-widest font-medium text-outline hover:text-primary transition-colors duration-300">Womenswear</Link>
          <Link to="/" className="font-sans text-xs uppercase tracking-widest font-medium text-outline hover:text-primary transition-colors duration-300">Atelier Archives</Link>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-sans text-xs uppercase tracking-widest font-bold text-primary mb-2">Boutique</h4>
          <Link to="/" className="font-sans text-xs uppercase tracking-widest font-medium text-outline hover:text-primary transition-colors duration-300">Sustainability</Link>
          <Link to="/" className="font-sans text-xs uppercase tracking-widest font-medium text-outline hover:text-primary transition-colors duration-300">Shipping & Returns</Link>
          <Link to="/" className="font-sans text-xs uppercase tracking-widest font-medium text-outline hover:text-primary transition-colors duration-300">Privacy Policy</Link>
          <Link to="/" className="font-sans text-xs uppercase tracking-widest font-medium text-outline hover:text-primary transition-colors duration-300">Contact</Link>
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="font-sans text-xs uppercase tracking-widest font-bold text-primary mb-2">Newsletter</h4>
          <div className="relative">
            <input 
              type="email" 
              placeholder="YOUR EMAIL" 
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary text-[10px] py-2 px-0 transition-colors focus:ring-0 outline-none" 
            />
            <button className="absolute right-0 bottom-2 text-primary">
              <ArrowRight className="w-4 h-4" strokeWidth={1} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 border-t border-outline-variant pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-outline">© 2024 SUFASHION ATELIER. ALL RIGHTS RESERVED.</span>
        <div className="flex gap-8">
          <a href="#" className="text-[10px] uppercase tracking-[0.2em] text-outline hover:text-primary transition-colors">Instagram</a>
          <a href="#" className="text-[10px] uppercase tracking-[0.2em] text-outline hover:text-primary transition-colors">Vogue</a>
        </div>
      </div>
    </footer>
  );
}
