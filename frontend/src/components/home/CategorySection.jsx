import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

function CategoryCard({ title, image }) {
  return (
    <div className="flex-none w-[450px] group cursor-pointer">
      <div className="aspect-[4/5] overflow-hidden mb-6 bg-surface-container">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" 
        />
      </div>
      <div className="flex justify-between items-center text-primary">
        <h3 className="text-2xl font-serif italic">{title}</h3>
        <ArrowUpRight className="w-6 h-6" strokeWidth={1} />
      </div>
    </div>
  );
}

export default function CategorySection() {
  return (
    <section className="py-20 bg-surface">
      <div className="px-8 mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif italic mb-2 text-primary">Curated Spaces</h2>
          <p className="text-outline font-light font-sans">Explore our seasonal edits</p>
        </div>
        <div className="flex gap-2">
          <button className="w-12 h-12 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors text-primary">
            <ChevronLeft className="w-6 h-6" strokeWidth={1} />
          </button>
          <button className="w-12 h-12 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors text-primary">
            <ChevronRight className="w-6 h-6" strokeWidth={1} />
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto hidden-scrollbar gap-8 px-8 pb-4">
        <CategoryCard 
          title="Leather Accessories" 
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuBwSSED4Ef4JDsB78_7P2zhpgPXFGLuFZ9ScnUeo4f384o1ErtURUhdQGmq8p82U6yhUwEhxrTPah3YI1uLqJyZSadgzNh6mTdM0AuV6IQZk3Vmptz5bwNv562lz7d6QY6-tVzxlJ2s0ZYNBuNeomywuqg8CqTFJRVxckzyMCp-hD1AIjR5ii1MlHjDPJFE5gVdDPNQr4KiSV7mGk6DgzGXfBDvZdgSDMJbVqZhYfcQXf7faoBsWMUldLivjNQamqj1Nbzxxt0m1FM" 
        />
        <CategoryCard 
          title="The Evening Edit" 
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuA4HE7os-J-IOJcYb8G7n-Q8vf7U-k9_1q-_HD0-BDgT0TtUfwm9Tg_AQ_-auEC_-5NJ_RQFVuq4_BhP9DLmSBGZNWpl2N05fMyo5sJtXiBdEBP1XYLHoQrA4WuPuYcNwtd1fLLagwoqpdkpbXbWfsIlaObwTRJTiXN8k1-eLpyPI5iR4FlNaz8_ml711Ucn-F9zK4lnXk1zKPd5IFP88XNW091hFz7d9LLVw9J7S0arKOvc3ySYsuxtG5M9OQpzp6-PGlZlBcoDbA" 
        />
        <CategoryCard 
          title="Modern Tailoring" 
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuCn5MgUUyUjZiFyxoMMvJqDcHA3sbeloIgrnsg14kyk4OyAsW-r4ITUz5rMrLxaZrbkPfMpRGcsboTpDeosc0VXbrGHLxLmKeVWx-HmDLmusCGqDhpcF2hGV0AJhDcJXTcakvhS9fxxUvbo9Wv27oCoGmk3NN2cixGK1hknoNZQQgzA2HacyfpRaZVGTwYvbXux60MrPCA6zfMNmJLGzXORFbe-eP3Mndi8Ny_7mwqvjB9TAbx8LaHN2aCe9-zz-BQw1n6b9yg7R8I" 
        />
      </div>
    </section>
  );
}
