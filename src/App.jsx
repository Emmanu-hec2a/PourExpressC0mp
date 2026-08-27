import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlassWater,
  Store,
  Truck,
  ShieldCheck,
  MapPin,
  LayoutDashboard,
  Zap,
  Smartphone,
  ChevronRight,
  ArrowRight,
  Mail,
  ExternalLink,
  CheckCircle2,
  Menu,
  X,
  MessageSquare,
  Globe,
  Send,
  Bike,
  Music2,
  Phone
} from 'lucide-react';
import './index.css';

// --- Scroll to Top Helper ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- Components ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Platform', href: isHome ? '#how-it-works' : '/#how-it-works' },
    { name: 'Solutions', href: isHome ? '#features' : '/#features' },
    { name: 'Pricing', href: isHome ? '#pricing' : '/#pricing' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled || !isHome ? 'glass-nav py-1' : 'bg-transparent py-3'}`}>
      <div className="container-custom flex justify-between items-center">
        <Link to="/" className="flex items-center gap-1 group cursor-pointer">
          <div className="group-hover:scale-105 transition-transform duration-300">
             <img
               src="/src/assets/logo.png"
               className="h-16 w-auto object-contain"
               alt="PourExpress Logo"
             />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white uppercase italic">PourExpress</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="hover:text-brand-orange transition-colors">{link.name}</a>
          ))}
          <a href="https://merchants.tipsytheoryy.com" target="_blank" rel="noopener noreferrer" className="btn-premium btn-primary text-xs py-2 px-5">
            Get Started
          </a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed z-[60] bg-black/80 backdrop-blur-md md:hidden"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-3/4 max-w-sm z-[70] p-8 flex flex-col md:hidden shadow-2xl"
              style={{ backgroundColor: '#082925', position: 'fixed', top: 0, right: 0, height: '100vh' }}
            >
              <div className="flex justify-end mb-12">
                <button className="text-white p-2 hover:bg-white/5 rounded-full transition-colors" onClick={() => setIsOpen(false)}>
                  <X size={32} />
                </button>
              </div>

              <div className="flex flex-col gap-8 text-2xl font-bold">
                {navLinks.map((link) => (
                  <a key={link.name} href={link.href} className="text-white/90 hover:text-brand-orange transition-colors" onClick={() => setIsOpen(false)}>
                    {link.name}
                  </a>
                ))}

                <div className="mt-8 pt-8 border-t border-white/10">
                  <a href="https://merchants.tipsytheoryy.com" target="_blank" rel="noopener noreferrer" className="btn-premium btn-primary justify-center py-4 text-base">
                    Partner With Us
                  </a>
                </div>
              </div>

              <div className="mt-auto pb-8">
                 <div className="flex items-center gap-1 mb-6">
                    <div>
                      <img src="/src/assets/logo.png" className="h-10 w-auto object-contain" alt="Logo" />
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-white uppercase italic">PourExpress</span>
                 </div>
                 <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">
                   Kenya's Premium Liquor <br /> Operating System
                 </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  const [currentImg, setCurrentImg] = useState(0);
  const images = [
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&q=80&w=2000",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-brand-green">
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          <motion.div
            key={currentImg}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${images[currentImg]})` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-green via-brand-green/80 to-transparent" />
        <div className="absolute inset-0 bg-brand-green/20" />
      </div>

      <div className="container-custom relative z-10 px-6 sm:px-8 lg:px-8 pt-24 pb-12 flex justify-start">
        <div className="max-w-xl text-left">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6">
              The Operating System for <span className="text-brand-orange">Liquor Commerce.</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              A premium dark-themed ecosystem connecting merchants, riders, and customers with seamless logistics and behavioral compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-start items-center">
              <a href="https://merchants.tipsytheoryy.com" target="_blank" rel="noopener noreferrer" className="btn-premium btn-primary px-8 py-4 text-base">
                Scale Your Store <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#features" className="btn-premium btn-secondary backdrop-blur-md px-8 py-4 text-base">
                Explore The Platform
              </a>
            </div>

            {/* <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-16 inline-flex items-center gap-3 bg-brand-green-dark/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5 mr-auto"
            >
            </motion.div> */}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ValueProp = () => {
  const steps = [
    {
      icon: <Smartphone className="w-6 h-6 text-brand-orange" />,
      title: "Seamless Experience",
      desc: "Native-grade mobile ordering with real-time tracking and automated M-PESA checkout."
    },
    {
      icon: <LayoutDashboard className="w-6 h-6 text-brand-orange" />,
      title: "Merchant Command",
      desc: "Full-stack dashboard for inventory, rider dispatch, and deep sales analytics."
    },
    {
      icon: <Truck className="w-6 h-6 text-brand-orange" />,
      title: "Logistics Engine",
      desc: "Haversine-based delivery zones and live GPS coordination for sub-30min delivery."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-brand-green-dark relative overflow-hidden">
      <div className="container-custom relative">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <h2 className="text-4xl font-bold text-white mb-6">Designed for Growth.</h2>
          <p className="text-white/60 text-lg">One unified platform serving three critical roles in the ecosystem.</p>
        </div>

        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/10 md:-translate-x-1/2" />
          <div className="space-y-12 md:space-y-0">
            {steps.map((step, idx) => (
              <div key={idx} className={`relative flex flex-col md:flex-row items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                <motion.div
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="w-full md:w-1/2 pl-12 md:pl-0 md:px-12"
                >
                  <div className="card-minimal text-center bg-white/5">
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed max-w-sm mx-auto">{step.desc}</p>
                  </div>
                </motion.div>
                <div className="absolute left-4 md:left-1/2 top-0 md:top-1/2 -translate-y-0 md:-translate-y-1/2 -translate-x-1/2 z-10">
                  <div className="w-8 h-8 rounded-full bg-brand-green border-4 border-white/10 flex items-center justify-center relative">
                    <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      whileInView={{ width: "40px", opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-brand-orange/40 to-transparent ${idx % 2 === 0 ? 'right-full rotate-180' : 'left-full'}`}
                    />
                  </div>
                </div>
                <div className="hidden md:block w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const LogisticsMap = () => {
  return (
    <section id="features" className="py-24 bg-brand-green overflow-hidden relative">
      <div className="container-custom grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative h-[400px] bg-brand-green-dark rounded-[48px] flex items-center justify-center overflow-hidden order-2 lg:order-1"
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <svg width="500" height="300" viewBox="0 0 500 300" className="relative z-10 overflow-visible">
            <motion.path
              d="M 50,150 Q 150,50 250,150 T 450,150"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeDasharray="8 8"
              strokeOpacity="0.1"
            />
            <motion.path
              d="M 50,150 Q 150,50 250,150 T 450,150"
              fill="none"
              stroke="var(--color-brand-orange)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <g transform="translate(40, 140)">
              <circle r="14" fill="var(--color-brand-green)" />
              <Store className="w-5 h-5 text-brand-orange -translate-x-2.5 -translate-y-2.5" />
            </g>
            <g transform="translate(440, 140)">
              <circle r="14" fill="var(--color-brand-orange)" />
              <MapPin className="w-5 h-5 text-white -translate-x-2.5 -translate-y-2.5" />
            </g>
            <motion.g
              initial={{ offsetDistance: "0%" }}
              animate={{ offsetDistance: "100%" }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{
                offsetPath: `path("M 50,150 Q 150,50 250,150 T 450,150")`,
                offsetRotate: "0deg"
              }}
            >
              <circle r="15" fill="var(--color-brand-orange)" className="blur-md opacity-40" />
              <g transform="translate(-10, -10)">
                <circle r="10" fill="white" />
                <Bike className="w-3 h-3 text-brand-orange translate-x-[3.5px] translate-y-[3.5px]" />
              </g>
            </motion.g>
          </svg>
          <div className="absolute bottom-6 right-8 flex gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
             <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-orange" /> Active Rider</span>
             <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/10" /> Merchant</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-1 lg:order-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-brand-orange text-xs font-bold uppercase mb-6">
            <MapPin className="w-3 h-3" />
            Hyper-Local Precision
          </div>
          <h2 className="text-4xl font-bold text-white mb-6">Live Logistics Intelligence.</h2>
          <p className="text-white/60 text-lg leading-relaxed mb-8">
            Experience sub-30 minute delivery powered by haversine distance validation and real-time GPS coordination. Every rider, every turn, perfectly synchronized.
          </p>
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-bold text-white mb-1">0.5m</p>
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Accuracy</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <p className="text-3xl font-bold text-white mb-1">2s</p>
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Ping Interval</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureHighlight = () => {
  const features = [
    {
      badge: "Multi-Tenant SaaS",
      title: "Cloud Infrastructure for Everyone",
      body: "Our architecture supports unlimited licensed merchants with complete data isolation. Lower commissions — as you scale up.",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=85&w=1200",
      imageAlt: "Modern data center infrastructure"
    },
    {
      badge: "TipsyTrust™ Compliance",
      title: "Legal Safety as a Service",
      body: "A proprietary 3-tier age verification system: Behavioral analysis, selfie validation at checkout, and physical ID verification upon delivery. Built for compliance.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=85&w=1200",
      imageAlt: "Signed compliance documentation"
    }
  ];

  return (
    <section id="features" className="py-24 bg-brand-green overflow-hidden">
      <div className="container-custom">
        {features.map((f, i) => (
          <div key={i} className={`flex flex-col lg:flex-row items-center gap-16 mb-24 last:mb-0 ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
            <motion.div
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 text-brand-orange text-xs font-bold tracking-wider uppercase mb-6">
                {f.badge}
              </div>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">{f.title}</h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">{f.body}</p>
              <ul className="space-y-4">
                {['Bank-grade security', '24/7 Monitoring', 'Scalable Architecture'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-medium text-white/70">
                    <CheckCircle2 className="w-5 h-5 text-brand-orange" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 w-full"
            >
              <div className="rounded-lg aspect-square lg:aspect-video relative group overflow-hidden bg-brand-green-light">
                <img
                  src={f.image}
                  alt={f.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-brand-green/35 transition-opacity duration-500 group-hover:opacity-20" />
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "0",
      features: ["Order Management", "Basic Product List", "Inventory Tracking", "10% Commission Rate", "Community Support"],
      btn: "Get Started Free"
    },
    {
      name: "Base",
      price: "3,000",
      features: ["Everything in Free", "8% Lower Commission", "Real-time Inventory Alerts", "Standard Analytics", "Rider Dispatch Tools"],
      btn: "Start Free Trial"
    },
    {
      name: "Pro",
      price: "5,000",
      features: ["Everything in Base", "5% Elite Commission", "Marketing SMS Blasts", "Smart Promotions Dashboard", "Elite Data Insights"],
      highlight: true,
      btn: "Go Elite Pro"
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["Includes ALL Pro Features", "Negotiable Commission", "Multi-Branch Management", "API & POS Integration", "Priority 24/7 Support"],
      btn: "Contact Sales"
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-brand-green-dark">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Transparent Pricing.</h2>
          <p className="text-white/40">No hidden fees. Lower commissions. Just growth.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p, i) => (
            <div key={i} className={`relative p-8 rounded-[48px] ${p.highlight ? 'bg-white/10' : 'bg-white/5'} transition-all duration-500 hover:bg-white/[0.12] flex flex-col`}>
              {p.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-orange px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-2 text-white">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-sm font-medium text-white/40">KES</span>
                <span className="text-4xl font-black text-white">{p.price}</span>
                {p.price !== 'Custom' && <span className="text-sm font-medium text-white/40">/mo</span>}
              </div>
              <ul className="space-y-4 mb-10 text-white/60 flex-1">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-brand-orange" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={p.name === 'Enterprise' ? "mailto:support@s.tipsytheoryy.com" : "https://merchants.tipsytheoryy.com"}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full btn-premium justify-center text-xs py-3 ${p.highlight ? 'bg-white text-brand-green-dark hover:bg-gray-100' : 'btn-primary'}`}
              >
                {p.btn}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Founder = () => {
  return (
    <section className="py-24 bg-brand-green">
      <div className="container-custom">
        <div className="bg-brand-green-dark rounded-[64px] p-8 lg:p-20 flex flex-col lg:flex-row items-center gap-16">
          <div className="relative group">
            <div className="w-64 h-64 rounded-[40px] bg-brand-green overflow-hidden relative z-10">
              <div className="absolute inset-0 flex items-center justify-center text-white/5">
                 <Globe className="w-32 h-32" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-green-dark/80 to-transparent" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-orange/20 rounded-full blur-[80px]" />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-white mb-2">Emmanuel Odongo</h2>
            <p className="text-brand-orange font-bold text-sm tracking-widest uppercase mb-8">Founder & Chief Architect</p>
            <blockquote className="text-2xl text-white/80 font-medium leading-relaxed italic mb-8">
              "I built PourExpress to solve a real logistics challenge in Kenya. By combining multi-tenant SaaS with hyper-local GPS intelligence, we're giving merchants the tools to compete in the digital age."
            </blockquote>
            <div className="flex flex-wrap gap-4">
               <a href="https://emmanu-hec2a.github.io/webport" target="_blank" rel="noopener noreferrer" className="btn-premium btn-secondary">
                 View Portfolio <ExternalLink className="w-4 h-4" />
               </a>
               <a href="mailto:odiwourmanu123@gmail.com" className="btn-premium btn-primary">
                 <Mail className="w-4 h-4" /> Get in Touch
               </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const socials = [
    { icon: Phone, href: "https://wa.me/254718258821", label: "WhatsApp" },
    { icon: Music2, href: "https://tiktok.com/@pourexpress", label: "TikTok" },
    { icon: Globe, href: "https://pourexpress.co.ke", label: "Website" }
  ];

  return (
    <footer className="bg-brand-green-dark pt-20 pb-10">
      <div className="container-custom">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
             <div className="flex items-center gap-1 mb-6">
                <div>
                  <img src="/src/assets/logo.png" className="h-10 w-auto object-contain" alt="Logo" />
                </div>
                <span className="text-xl font-bold tracking-tighter text-white uppercase italic">PourExpress</span>
             </div>
             <p className="text-white/50 max-w-sm leading-relaxed mb-6">
               Revolutionizing Kenya's liquor retail through intelligent logistics and hardened payment reconciliation.
             </p>
             <div className="flex gap-4">
                {socials.map((social, i) => (
                  <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-brand-orange hover:text-white transition-all" title={social.label}>
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
             </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><a href="https://merchants.tipsytheoryy.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange">Merchant Dashboard</a></li>
              <li className="flex items-center gap-2">
                <span className="text-white/30 cursor-not-allowed">Customer App</span>
                <span className="bg-brand-orange/10 text-brand-orange text-[8px] px-1.5 py-0.5 rounded uppercase font-black">5 Days to Launch</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white/30 cursor-not-allowed">Rider App</span>
                <span className="bg-white/5 text-white/40 text-[8px] px-1.5 py-0.5 rounded uppercase font-black">Alpha Testing</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Company</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link to="/about" className="hover:text-brand-orange">About Us</Link></li>
              <li><a href="mailto:support@s.tipsytheoryy.com" className="hover:text-brand-orange">Support</a></li>
              <li><a href="https://pourexpress.co.ke" className="hover:text-brand-orange font-bold text-white/80 italic">pourexpress.co.ke</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30 font-medium">
          <p>© 2026 PourExpress. All rights reserved.</p>
          <div className="flex gap-8">
             <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
             <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Legal Pages ---
const LegalLayout = ({ title, children }) => (
  <div className="min-h-screen bg-brand-green-dark pt-32 pb-24">
    <div className="container-custom max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-[48px] p-8 lg:p-16 border border-white/5"
      >
        <h1 className="text-4xl lg:text-6xl font-bold text-white mb-12">{title}</h1>
        <div className="prose prose-invert max-w-none text-white/70 leading-relaxed space-y-8">
          {children}
        </div>
      </motion.div>
    </div>
  </div>
);

const AboutPage = () => (
  <LegalLayout title="About Us">
    <section>
      <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
      <p>PourExpress is Kenya's premier logistics operating system designed specifically for the liquor commerce industry. Our mission is to empower local merchants with Big Tech infrastructure, enabling seamless, compliant, and hyper-fast delivery for customers nationwide.</p>
    </section>
    <section>
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Operating System for Liquor</h2>
      <p>We provide more than just delivery; we provide a complete multi-tenant SaaS ecosystem. From real-time GPS tracking and automated M-PESA reconciliation to our proprietary TipsyTrust™ age verification system, we handle the complexity so merchants can focus on growth.</p>
    </section>
    <section>
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Founded for Excellence</h2>
      <p>Built by engineers who understand the unique challenges of the Kenyan market, PourExpress combines haversine-based logistics intelligence with bank-grade security to ensure every transaction is safe, legal, and efficient.</p>
    </section>
  </LegalLayout>
);

const PrivacyPage = () => (
  <LegalLayout title="Privacy Policy">
    <p>Last updated: June 2026</p>
    <section>
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information Collection</h2>
      <p>We collect information necessary to provide our logistics and commerce services, including merchant data, GPS coordinates for delivery, and transaction history verified via M-PESA.</p>
    </section>
    <section>
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Usage of Data</h2>
      <p>Your data is used to optimize delivery routes, facilitate secure payments, and ensure behavioral compliance across the PourExpress ecosystem.</p>
    </section>
    <section>
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. TipsyTrust™ Security</h2>
      <p>All sensitive information is processed through our bank-grade secure infrastructure with multi-tenant isolation, ensuring your business data remains private and protected.</p>
    </section>
  </LegalLayout>
);

const TermsPage = () => (
  <LegalLayout title="Terms of Service">
    <p>Last updated: June 2026</p>
    <section>
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Service Agreement</h2>
      <p>By using PourExpress, you agree to comply with Kenya's liquor retail regulations and our behavioral compliance standards.</p>
    </section>
    <section>
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Merchant Obligations</h2>
      <p>Merchants must maintain valid licensing and adhere to our 3-tier age verification system (TipsyTrust™) to ensure legal safety across the platform.</p>
    </section>
    <section>
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Fees & Commissions</h2>
      <p>PourExpress operates on a flat subscription model. Standard tiers receive $0 commission on sales, allowing merchants to retain 100% of their revenue.</p>
    </section>
  </LegalLayout>
);

const Home = () => (
  <>
    <Hero />
    <ValueProp />
    <LogisticsMap />
    <FeatureHighlight />
    <Pricing />
    <Founder />
  </>
);

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen selection:bg-brand-orange/30 selection:text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}
