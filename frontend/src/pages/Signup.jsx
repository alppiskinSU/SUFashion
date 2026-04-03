import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    tax_id: '',
    address: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.first_name} ${form.last_name}`.trim(),
          email: form.email,
          password: form.password,
          home_address: form.address,
          tax_id: form.tax_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      navigate('/login');
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (p.length === 0) return { bars: 0, label: '' };
    if (p.length < 6) return { bars: 1, label: 'Weak' };
    if (p.length < 10) return { bars: 2, label: 'Medium' };
    return { bars: 3, label: 'Strong' };
  };

  const { bars, label } = passwordStrength();

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-surface">
      {/* Left Side: Editorial Image */}
      <section className="hidden md:block md:w-5/12 lg:w-1/2 relative h-screen sticky top-0">
        <div className="absolute inset-0 bg-primary/10 z-10"></div>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWVzdcMlQpxoWgB4HdlJYqIO0uLMYK6Yub1Rhj3CFyIBSBZSZDFFqehMcQuou4ZBcskrOz-sfs828_Ax7hZmRaoOx87vB2IbRL-YCPHnKxGgw6iCj_IpaEswtGoePNgaP4uwa_oH2IFnXEpxyIUNdsGc-YzvfYoO-ZNsyzv7WsMsjiRLeAt5v0IGAN4U8eK-fCHIDnEgXzbWaaluz55UtkfMsqU6lXq1AJdsZxX6c4POiWzHyBBDWfEHNvMUTS0P7hRpgyP80J_TE"
          alt="High-end fashion editorial"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 z-20 max-w-md">
          <img src="/sufashion-logo-w.svg" alt="SUFashion Logo" className="h-16 mb-4" />
          <p className="text-white/80 font-sans text-sm uppercase tracking-[0.3em]">
            The Digital Atelier
          </p>
        </div>
      </section>

      {/* Right Side: Signup Form */}
      <section className="relative w-full md:w-7/12 lg:w-1/2 bg-surface-container-low flex items-center justify-center p-6 md:p-12 lg:p-20 overflow-y-auto hidden-scrollbar">
        <div className="w-full max-w-xl z-10">
          {/* Header */}
          <header className="mb-12">
            <div className="md:hidden mb-8">
              <img src="/sufashion-logo-w.svg" alt="SUFashion Logo" className="h-12" />
            </div>
            <h2 className="font-serif text-4xl lg:text-5xl text-primary tracking-tight mb-2">Create Account</h2>
            <p className="font-sans text-outline font-medium text-sm tracking-wide">Enter the atelier. Join our curated fashion community.</p>
          </header>

          {/* Form */}
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <Input label="First Name" id="first_name" value={form.first_name} onChange={handleChange} required />
              <Input label="Last Name" id="last_name" value={form.last_name} onChange={handleChange} required />
            </div>

            <Input label="Email Address" id="email" type="email" value={form.email} onChange={handleChange} required />

            {/* Tax ID & Address */}
            <div className="grid grid-cols-1 gap-8">
              <Input label="Tax ID" id="tax_id" value={form.tax_id} onChange={handleChange} />
              <Input label="Home Address" id="address" value={form.address} onChange={handleChange} />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Input label="Password" id="password" type="password" value={form.password} onChange={handleChange} required />
                {form.password.length > 0 && (
                  <>
                    <div className="mt-4 flex gap-1 h-1 w-full">
                      <div className={bars >= 1 ? 'bg-primary w-1/3' : 'bg-outline-variant w-1/3'}></div>
                      <div className={bars >= 2 ? 'bg-primary w-1/3' : 'bg-outline-variant w-1/3'}></div>
                      <div className={bars >= 3 ? 'bg-primary w-1/3' : 'bg-outline-variant w-1/3'}></div>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-outline mt-1 block">{label}</span>
                  </>
                )}
              </div>
              <Input label="Confirm Password" id="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} required />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-xs uppercase tracking-widest">{error}</p>
            )}

            {/* Terms */}
            <div className="flex items-start gap-3 py-4">
              <div className="relative flex items-center">
                <input type="checkbox" id="terms" required className="appearance-none peer w-4 h-4 rounded-none border border-outline bg-transparent checked:bg-primary checked:border-primary cursor-pointer transition-all" />
                <Check className="w-3 h-3 text-white absolute pointer-events-none left-[2px] opacity-0 peer-checked:opacity-100" strokeWidth={3} />
              </div>
              <label htmlFor="terms" className="text-[11px] uppercase tracking-wider text-outline font-medium leading-relaxed">
                I agree to the <a href="#" className="text-primary underline underline-offset-4">Terms and Conditions</a> and <a href="#" className="text-primary underline underline-offset-4">Privacy Policy</a>.
              </label>
            </div>

            {/* CTA */}
            <div className="pt-6 space-y-6">
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2" type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4 ml-1" strokeWidth={2} />}
              </Button>
              <div className="text-center">
                <p className="font-sans text-xs text-outline tracking-widest uppercase font-medium">
                  Already have an account?
                  <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4 ml-2">Log In</Link>
                </p>
              </div>
            </div>
          </form>

          {/* Footer Links (Mini) */}
          <footer className="mt-20 pt-10 border-t border-outline-variant/30 flex flex-wrap gap-x-8 gap-y-4">
            <a href="#" className="text-[10px] uppercase tracking-[0.2em] text-outline hover:text-primary transition-colors">Support</a>
            <a href="#" className="text-[10px] uppercase tracking-[0.2em] text-outline hover:text-primary transition-colors">Atelier Policy</a>
            <a href="#" className="text-[10px] uppercase tracking-[0.2em] text-outline hover:text-primary transition-colors">Sustainability</a>
          </footer>
        </div>
      </section>
    </div>
  );
}
