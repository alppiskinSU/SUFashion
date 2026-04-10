import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Gem, Scissors, Mail } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ── Stat Counter ── */
function Stat({ value, label }) {
  return (
    <div className="text-center">
      <span className="block text-5xl md:text-6xl font-serif italic text-primary mb-3">{value}</span>
      <span className="text-[10px] uppercase tracking-[0.25em] text-outline font-sans font-medium">{label}</span>
    </div>
  );
}

/* ── Value Pillar Card ── */
function ValueCard({ icon: Icon, title, description }) {
  return (
    <div className="group p-8 md:p-10 border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-all duration-700 cursor-default">
      <Icon className="w-7 h-7 text-primary mb-8" strokeWidth={1} />
      <h3 className="font-serif italic text-2xl text-primary mb-4">{title}</h3>
      <p className="text-sm text-outline font-sans leading-relaxed">{description}</p>
    </div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow">
        {/* ────────── Hero ────────── */}
        <section className="relative pt-36 pb-28 px-8 md:px-16 lg:px-24 flex flex-col items-center text-center overflow-hidden">
          {/* Decorative accent block — mirrors hero on home page */}
          <div className="absolute top-0 left-[-10vw] w-1/3 h-full bg-secondary-container/15 skew-x-12 transform origin-top-left pointer-events-none" />

          <span className="relative z-10 uppercase tracking-[0.4em] text-sm text-outline font-sans font-medium mb-8">
            Our Story
          </span>
          <h1 className="relative z-10 text-6xl md:text-[7rem] lg:text-[9rem] font-serif tracking-tighter leading-[0.85] text-primary mb-10">
            The <br className="hidden md:block" />
            <span className="italic font-light text-primary/90">Atelier</span>
          </h1>
          <p className="relative z-10 text-lg md:text-xl font-sans text-outline max-w-2xl leading-relaxed">
            Born from the belief that fashion should whisper, not shout.
            SUFashion is a digital atelier where meticulous craft meets editorial vision — designing pieces that live beyond seasons.
          </p>
        </section>

        {/* ────────── Full-width Image ────────── */}
        <section className="w-full h-[60vh] md:h-[70vh] overflow-hidden bg-surface-container-high">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpgKQNcguVe0d_sOqj-61CvgpzNz2RY8LbeFxJkSzhC2_RC15tf59UufSbblR-ktyCl807GwKgaHmJ12HBgaKSrVpBdXaQFyW1tAK73_QvVDX62xL3k-aXF0_Rj9bR6-PJaDHvdojqcTwNsS1z3ZQAFLT69fKqW3oJg9W8VnE2GAj43yOlHAKQKMLTXzfilG-XNoL1vWX6FlsNuEljc3ku4AyNJCfGjQvtEKL2j_MMRnJ-folf9QoZdryes69K8ApzJuAWjaa5JhA"
            alt="Atelier workspace"
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[2s]"
          />
        </section>

        {/* ────────── Philosophy ────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-primary text-on-primary flex flex-col justify-center px-12 md:px-24 py-24">
            <p className="text-sm uppercase tracking-[0.5em] mb-10 opacity-60 font-sans">Philosophy</p>
            <h2 className="text-4xl md:text-6xl font-serif italic leading-tight mb-8">
              Quiet Luxury,<br />Loud Intention.
            </h2>
            <p className="text-base text-outline font-light leading-relaxed max-w-lg font-sans">
              Every stitch carries purpose. We reject fast trends in favor of enduring silhouettes —
              garments that are felt before they are seen. Our design language draws from brutalist
              architecture and organic textiles, finding beauty at the intersection of structure and softness.
            </p>
          </div>
          <div className="bg-surface-container-high overflow-hidden">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCn5MgUUyUjZiFyxoMMvJqDcHA3sbeloIgrnsg14kyk4OyAsW-r4ITUz5rMrLxaZrbkPfMpRGcsboTpDeosc0VXbrGHLxLmKeVWx-HmDLmusCGqDhpcF2hGV0AJhDcJXTcakvhS9fxxUvbo9Wv27oCoGmk3NN2cixGK1hknoNZQQgzA2HacyfpRaZVGTwYvbXux60MrPCA6zfMNmJLGzXORFbe-eP3Mndi8Ny_7mwqvjB9TAbx8LaHN2aCe9-zz-BQw1n6b9yg7R8I"
              alt="Modern tailoring detail"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[2s]"
            />
          </div>
        </section>

        {/* ────────── Stats ────────── */}
        <section className="py-24 px-8 bg-surface">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
            <Stat value="2012" label="Year Founded" />
            <Stat value="47" label="Countries Reached" />
            <Stat value="100%" label="Organic Fabrics" />
            <Stat value="∞" label="Commitment to Craft" />
          </div>
        </section>

        {/* ────────── Values ────────── */}
        <section className="py-24 px-8 md:px-16 lg:px-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <span className="text-sm uppercase tracking-[0.5em] text-outline font-sans font-medium block mb-4">What Guides Us</span>
              <h2 className="text-4xl md:text-5xl font-serif italic text-primary">Our Pillars</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ValueCard
                icon={Scissors}
                title="Artisan Craft"
                description="Each piece is developed through dozens of iterations in our atelier, refined until the drape, weight, and feel achieve an effortless perfection that only patience can produce."
              />
              <ValueCard
                icon={Leaf}
                title="Conscious Materials"
                description="We source exclusively organic, traceable textiles — from hand-spun Japanese linens to ethically harvested Mongolian cashmere. No compromise, no shortcuts."
              />
              <ValueCard
                icon={Gem}
                title="Timeless Design"
                description="Trends expire; intention endures. Our collections are designed to transcend seasons, building a wardrobe that evolves with you rather than against you."
              />
            </div>
          </div>
        </section>

        {/* ────────── CTA / Contact Strip ────────── */}
        <section className="bg-primary text-on-primary py-24 px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div>
              <p className="text-sm uppercase tracking-[0.5em] opacity-60 font-sans mb-4">Get in Touch</p>
              <h2 className="text-3xl md:text-5xl font-serif italic leading-tight">
                We'd Love to<br />Hear From You.
              </h2>
            </div>
            <a
              href="mailto:hello@sufashion.com"
              className="inline-flex items-center gap-3 border-b-2 border-on-primary pb-2 uppercase tracking-widest text-xs font-bold hover:opacity-70 transition-opacity font-sans"
            >
              <Mail className="w-4 h-4" strokeWidth={1.5} />
              hello@sufashion.com
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
