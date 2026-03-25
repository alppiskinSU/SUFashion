import React from 'react';

export default function EditorialSection() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 h-screen">
      <div className="relative overflow-hidden bg-surface-container-high">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpgKQNcguVe0d_sOqj-61CvgpzNz2RY8LbeFxJkSzhC2_RC15tf59UufSbblR-ktyCl807GwKgaHmJ12HBgaKSrVpBdXaQFyW1tAK73_QvVDX62xL3k-aXF0_Rj9bR6-PJaDHvdojqcTwNsS1z3ZQAFLT69fKqW3oJg9W8VnE2GAj43yOlHAKQKMLTXzfilG-XNoL1vWX6FlsNuEljc3ku4AyNJCfGjQvtEKL2j_MMRnJ-folf9QoZdryes69K8ApzJuAWjaa5JhA" 
          alt="designer at work" 
          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[2s]" 
        />
      </div>
      <div className="bg-primary text-on-primary flex flex-col justify-center px-12 md:px-24">
        <p className="text-sm uppercase tracking-[0.5em] mb-12 opacity-60 font-sans">The Journal</p>
        <h2 className="text-5xl md:text-7xl font-serif italic leading-tight mb-8">Crafting the Future of Quiet Luxury.</h2>
        <p className="text-lg text-outline font-light mb-12 leading-relaxed max-w-lg font-sans">
          Dive into our latest atelier session where we explore the intersection of brutalist architecture and organic textiles. A study in form, function, and the silent strength of minimalism.
        </p>
        <div>
          <a href="#" className="inline-block border-b-2 border-on-primary pb-2 uppercase tracking-widest text-xs font-bold hover:opacity-70 transition-opacity font-sans">Read the Story</a>
        </div>
      </div>
    </section>
  );
}
