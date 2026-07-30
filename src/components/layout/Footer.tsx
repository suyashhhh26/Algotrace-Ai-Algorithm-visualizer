import { motion } from 'framer-motion';
import { Code2, Share2, BookOpen, Sparkles, Heart } from 'lucide-react';

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative border-t border-white/[0.06] mt-20"
    >
      {/* Gradient divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">AlgoVision AI</span>
            </div>
            <p className="text-sm text-text-tertiary max-w-xs">
              Interactive algorithm visualization platform with premium animations and step-by-step execution.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Quick Links</h4>
            <div className="space-y-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'Algorithms', href: '/algorithms' },
                { label: 'About', href: '/about' },
                { label: 'Documentation', href: '/docs' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Connect</h4>
            <div className="flex gap-3">
              {[
                { icon: Code2, label: 'GitHub', href: '#' },
                { icon: Share2, label: 'LinkedIn', href: '#' },
                { icon: BookOpen, label: 'Docs', href: '/docs' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="btn-icon"
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">
            © 2025 AlgoVision AI. All rights reserved.
          </p>
          <p className="text-xs text-text-tertiary flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400" /> for CS students
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
