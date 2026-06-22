import React, { useState } from 'react';
import { Mail, User, MessageSquare, Send, Check } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setErrorText('');
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });
      if (res.ok) {
        setIsSubmitted(true);
        setName('');
        setEmail('');
        setMessage('');
      } else {
        const val = await res.json();
        setErrorText(val.error || "Submission failed. Please check form inputs.");
      }
    } catch (err: any) {
      setErrorText("Could not reach backend. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF9F6] py-16 px-4 md:px-8 font-sans" id="contact-page-layout">
      <div className="max-w-2xl mx-auto bg-white border border-[#D4AF37]/20 p-8 md:p-12 rounded-none" id="contact-container">
        
        {/* Title */}
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] block mb-2">Get in Touch</span>
          <h2 className="font-serif text-3xl font-light uppercase tracking-widest text-[#1A1A1A]">Contact Us</h2>
          <div className="h-0.5 w-12 bg-[#D4AF37] mx-auto mt-4"></div>
        </div>

        {/* Display Contact Email */}
        <div className="mb-10 text-center bg-[#FAF9F6] border border-[#D4AF37]/10 py-6 px-4 rounded-none">
          <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block mb-1">Direct Editorial Office</span>
          <a href="mailto:ah344wjwjueu@gmail.com" className="font-serif text-lg text-[#1A1A1A] hover:text-[#D4AF37] transition flex items-center justify-center gap-2 select-all">
            <Mail className="h-4 w-4 text-[#D4AF37]" />
            <span>ah344wjwjueu@gmail.com</span>
          </a>
        </div>

        {isSubmitted ? (
          <div className="text-center py-8 space-y-4" id="contact-submitted-message">
            <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <p className="font-serif text-lg text-stone-800 leading-relaxed max-w-md mx-auto">
              Thank you for contacting Veloura Wear. We will get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" id="contact-form">
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="block text-xs font-mono uppercase tracking-widest text-stone-500">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  id="contact-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none px-4 py-2.5 pl-10 text-xs text-stone-900 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="E.g., Audrey Hepburn"
                />
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="block text-xs font-mono uppercase tracking-widest text-stone-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  id="contact-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none px-4 py-2.5 pl-10 text-xs text-stone-900 focus:outline-none focus:border-[#D4AF37]"
                  placeholder="E.g., audrey@luxe.com"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-message" className="block text-xs font-mono uppercase tracking-widest text-stone-500">Editorial Inquiry / Message</label>
              <div className="relative">
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-4 pl-10 text-xs text-stone-900 focus:outline-none focus:border-[#D4AF37] font-serif"
                  placeholder="Write your editorial inquiry or style collaboration ideas here..."
                ></textarea>
                <MessageSquare className="absolute left-3.5 top-4 h-4 w-4 text-stone-400" />
              </div>
            </div>

            {errorText && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                {errorText}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-[#D4AF37] hover:bg-[#B8962E] text-white font-bold text-xs uppercase py-3 tracking-widest transition flex items-center justify-center gap-2 rounded-none ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Send className="h-3.5 w-3.5 animate-pulse" />
              <span>{isSubmitting ? "Sending inquiry..." : "Send Message"}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
