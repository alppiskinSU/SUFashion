import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Login() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-surface">
      {/* Left Side: Editorial Image */}
      <section className="relative hidden md:block h-full overflow-hidden">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuACltF6MNsqEZqSASFeToTMuPnTHkstJ-ur-jPDYiHrF04FfE-9tmfdrwaWrye4FcFg_O_JSi2kgYnVDutTuush0U5RW5d2_-Z2Ens1JYCfIac9Gdm6C0jIbAa58z-JT6eLCYdfSAJ_R6VjVCod0l3bodqQD8X0TX0We3ttZKKZExq4l482830PHcfnZ_05FT1W7k6I1yyP8R_VQhd6DjEsL_ZIUBuxTOmGdJh1X6HAzFQ1ikFbXDQSYp6grmzHW_-fSS_M_mQnrK8" 
          alt="High-end fashion editorial" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        
        {/* Logo Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-12 bg-black/10">
          <div className="z-20">
            <img src="/sufashion-logo-w.svg" alt="SUFashion Logo" className="h-16 mb-2" />
            <p className="font-serif italic text-white mt-2 text-lg">The Digital Atelier</p>
          </div>
          <div className="z-20 max-w-sm">
            <p className="text-white font-sans font-light leading-relaxed">
              Curating a digital gallery where the soul of the runway meets the precision of modern design.
            </p>
          </div>
        </div>
        {/* Gradient Overlay for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent pointer-events-none"></div>
      </section>

      {/* Right Side: Login Form */}
      <section className="relative bg-surface-container-low flex items-center justify-center p-8 md:p-24 lg:p-32">
        <div className="w-full max-w-md space-y-12 z-10">
          {/* Header */}
          <header className="space-y-4">
            <div className="md:hidden mb-8">
              <img src="/sufashion-logo-w.svg" alt="SUFashion Logo" className="h-12" />
            </div>
            <h2 className="font-serif text-4xl font-bold tracking-tight text-primary">Welcome Back</h2>
            <p className="text-outline font-sans text-sm tracking-wide uppercase">Enter your credentials to access the archive</p>
          </header>

          {/* Form */}
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-6 flex flex-col pt-4">
              <Input label="Email Address" id="email" type="email" />
              <Input 
                label="Password" 
                id="password" 
                type="password" 
                indicator={
                  <button type="button" className="absolute right-0 top-2 text-outline hover:text-primary transition-colors cursor-pointer flex items-center justify-center">
                    <Eye className="w-5 h-5" strokeWidth={1} />
                  </button>
                }
              />
            </div>

            {/* Helpers */}
            <div className="flex items-center justify-between font-sans text-xs tracking-wider uppercase">
              <label className="flex items-center cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer h-4 w-4 border-outline-variant rounded-none bg-transparent text-primary focus:ring-0 cursor-pointer" />
                  <span className="ml-2 text-outline group-hover:text-primary transition-colors">Remember Me</span>
                </div>
              </label>
              <a href="#" className="text-outline hover:text-primary transition-colors underline underline-offset-4">Forgot Password?</a>
            </div>

            {/* CTA */}
            <div className="pt-4 space-y-6">
              <Button variant="secondary" className="w-full" type="submit">
                Access Account
              </Button>
              <div className="text-center">
                <p className="font-sans text-sm text-outline">
                  Don't have an account? 
                  <Link to="/signup" className="text-primary font-semibold hover:underline underline-offset-4 ml-1">Sign Up</Link>
                </p>
              </div>
            </div>
          </form>

          {/* Footer inside right side */}
          <footer className="pt-12">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between w-full">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-outline">
                © 2024 SUFashion Atelier.
              </p>
              <nav className="flex gap-4">
                <a href="#" className="font-sans text-[10px] uppercase tracking-[0.2em] text-outline hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="font-sans text-[10px] uppercase tracking-[0.2em] text-outline hover:text-primary transition-colors">Terms</a>
              </nav>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
