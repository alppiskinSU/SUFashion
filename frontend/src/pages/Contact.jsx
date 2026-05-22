import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, ArrowRight, Send } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';

function ContactInfoCard({ icon, title, lines }) {
  const Icon = icon;
  return (
    <div className="group p-8 md:p-10 border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-all duration-700 cursor-default">
      <div className="text-primary mb-8">
        <Icon className="w-7 h-7" strokeWidth={1} />
      </div>
      <h3 className="font-serif italic text-2xl text-primary mb-4">{title}</h3>
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-outline font-sans leading-relaxed">
          {line.href ? (
            <a href={line.href} className="hover:text-primary transition-colors duration-300">
              {line.text}
            </a>
          ) : (
            line.text
          )}
        </p>
      ))}
    </div>
  );
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow">
        <section className="relative pt-36 pb-28 px-8 md:px-16 lg:px-24 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-0 right-[-10vw] w-1/3 h-full bg-secondary-container/15 -skew-x-12 transform origin-top-right pointer-events-none" />

          <span className="relative z-10 uppercase tracking-[0.4em] text-sm text-outline font-sans font-medium mb-8">
            Get in Touch
          </span>
          <h1 className="relative z-10 text-6xl md:text-[7rem] lg:text-[9rem] font-serif tracking-tighter leading-[0.85] text-primary mb-10">
            Contact<br />
            <span className="italic font-light text-primary/90">Us</span>
          </h1>
          <p className="relative z-10 text-lg md:text-xl font-sans text-outline max-w-2xl leading-relaxed">
            Whether you have a question about our collections, need styling advice,
            or simply want to connect — we're here for you.
          </p>
        </section>

        <section className="py-24 px-8 md:px-16 lg:px-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <span className="text-sm uppercase tracking-[0.5em] text-outline font-sans font-medium block mb-4">
                Information
              </span>
              <h2 className="text-4xl md:text-5xl font-serif italic text-primary">
                Reach Out
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <ContactInfoCard
                icon={MapPin}
                title="Visit Us"
                lines={[
                  { text: 'SUFashion Atelier' },
                  { text: '42 Rue du Faubourg' },
                  { text: 'Saint-Honoré, 75008 Paris' },
                ]}
              />
              <ContactInfoCard
                icon={Phone}
                title="Call Us"
                lines={[
                  { text: '+33 1 42 68 53 00' },
                  { text: 'Mon — Fri, 10:00 — 19:00 CET' },
                ]}
              />
              <ContactInfoCard
                icon={Mail}
                title="Email Us"
                lines={[
                  { text: 'hello@sufashion.com', href: 'mailto:hello@sufashion.com' },
                  { text: 'press@sufashion.com', href: 'mailto:press@sufashion.com' },
                ]}
              />
              <ContactInfoCard
                icon={Clock}
                title="Hours"
                lines={[
                  { text: 'Monday — Friday' },
                  { text: '10:00 — 19:00 CET' },
                  { text: 'Saturday' },
                  { text: '11:00 — 18:00 CET' },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-primary text-on-primary flex flex-col justify-center px-12 md:px-24 py-24">
            <p className="text-sm uppercase tracking-[0.5em] mb-10 opacity-60 font-sans">
              Send a Message
            </p>
            <h2 className="text-4xl md:text-5xl font-serif italic leading-tight mb-8">
              We'd Love to<br />Hear From You.
            </h2>
            <p className="text-base text-outline font-light leading-relaxed max-w-lg font-sans">
              Have a bespoke inquiry or a collaboration in mind? Drop us a line
              and our team will get back to you within 24 hours.
            </p>
          </div>
          <div className="bg-surface-container-lowest flex flex-col justify-center px-12 md:px-24 py-24">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-lg w-full">
              <div className="relative">
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder=" "
                  value={formData.name}
                  onChange={handleChange}
                  className="peer w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 focus:ring-0 focus:border-primary transition-colors text-primary outline-none"
                />
                <label
                  htmlFor="contact-name"
                  className="absolute left-0 top-2 text-outline font-sans text-xs uppercase tracking-widest transition-all duration-300 cursor-text pointer-events-none origin-left peer-focus:-translate-y-6 peer-focus:scale-85 peer-focus:text-primary peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-85 peer-[:not(:placeholder-shown)]:text-primary"
                >
                  Your Name
                </label>
              </div>

              <div className="relative">
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder=" "
                  value={formData.email}
                  onChange={handleChange}
                  className="peer w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 focus:ring-0 focus:border-primary transition-colors text-primary outline-none"
                />
                <label
                  htmlFor="contact-email"
                  className="absolute left-0 top-2 text-outline font-sans text-xs uppercase tracking-widest transition-all duration-300 cursor-text pointer-events-none origin-left peer-focus:-translate-y-6 peer-focus:scale-85 peer-focus:text-primary peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-85 peer-[:not(:placeholder-shown)]:text-primary"
                >
                  Email Address
                </label>
              </div>

              <div className="relative">
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  placeholder=" "
                  value={formData.subject}
                  onChange={handleChange}
                  className="peer w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 focus:ring-0 focus:border-primary transition-colors text-primary outline-none"
                />
                <label
                  htmlFor="contact-subject"
                  className="absolute left-0 top-2 text-outline font-sans text-xs uppercase tracking-widest transition-all duration-300 cursor-text pointer-events-none origin-left peer-focus:-translate-y-6 peer-focus:scale-85 peer-focus:text-primary peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-85 peer-[:not(:placeholder-shown)]:text-primary"
                >
                  Subject
                </label>
              </div>

              <div className="relative">
                <textarea
                  id="contact-message"
                  name="message"
                  rows="4"
                  placeholder=" "
                  value={formData.message}
                  onChange={handleChange}
                  className="peer w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 focus:ring-0 focus:border-primary transition-colors text-primary outline-none resize-none"
                />
                <label
                  htmlFor="contact-message"
                  className="absolute left-0 top-2 text-outline font-sans text-xs uppercase tracking-widest transition-all duration-300 cursor-text pointer-events-none origin-left peer-focus:-translate-y-6 peer-focus:scale-85 peer-focus:text-primary peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-85 peer-[:not(:placeholder-shown)]:text-primary"
                >
                  Your Message
                </label>
              </div>

              <Button variant="primary" type="submit" className="mt-4 self-start">
                <Send className="w-4 h-4" strokeWidth={1.5} />
                Send Message
              </Button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
