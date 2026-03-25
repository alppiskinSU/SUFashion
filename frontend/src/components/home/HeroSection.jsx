import React from 'react';
import Button from '../ui/Button';

export default function HeroSection() {
  return (
    <section className="relative w-full h-[921px] max-h-screen overflow-hidden flex items-center justify-center px-8">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPOueMj63gW3_DY6OxzsIC60-igKT9t5lZXqHJUSSZrrN1y2DS5bzGzFPaW9YOCB0ZatonnBHAw-9GmAeWGPs8JGQvwpvies0HEpRblCXmduoirfteaLj4w0jAlcA1GQ2MTUebW5zMjLMHKBqvLSyA6AaU_OLGbw_mvkjFVSJfvmxUjrnWYhenA_mPuRQ-UBZQJVhm8RjbEsubrpJn79O2ECoo9kCnUHMiDKzpmw9kMVnrV84OHE4aOfEEdZzBs1t9aQViNZhAPeY" 
          alt="New Season" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      <div className="relative z-10 text-center text-white max-w-4xl">
        <span className="uppercase tracking-[0.4em] text-sm mb-6 block font-medium font-sans">Spring / Summer 2024</span>
        <h1 className="text-6xl md:text-8xl font-serif italic tracking-tight leading-tight mb-10">New Season Collection</h1>
        <Button variant="white" className="mx-auto px-12 py-5 text-sm">
          Discover Atelier
        </Button>
      </div>
    </section>
  );
}
