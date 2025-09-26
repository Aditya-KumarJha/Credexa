"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Menu,
  X,
  Settings,
  ShieldCheck,
  Search,
  BarChart2,
  UsersIcon,
  Phone,
} from "lucide-react";
import ThemeToggleButton from "./ui/theme-toggle-button";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(pathname);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileOpen]);

  const navItems = [
  { href: "/verify", label: "Verify", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/community", label: "Community", icon: UsersIcon },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/#contact", label: "Contact Us", icon: Phone },
  ];

  const menuPanelVariants = {
    hidden: { x: "100%", transition: { when: "afterChildren", staggerChildren: 0.05, staggerDirection: -1 } },
    visible: { x: 0, transition: { when: "beforeChildren", staggerChildren: 0.1 } },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };
  
  const linkClass = (itemHref: string) =>
    `relative flex items-center gap-2 text-md font-medium transition-colors duration-300 px-4 py-2 rounded-full ${
      pathname === itemHref
        ? "text-white"
        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
    }`;
    
  const mobileLinkClass = (itemHref: string) =>
    `flex items-center gap-4 text-lg font-medium p-4 rounded-lg transition-colors ${
      pathname === itemHref
        ? "font-bold text-white bg-blue-600"
        : "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700"
    }`;


  return (
    <>
  <nav className="w-full top-0 left-0 z-[1000] backdrop-blur-lg shadow-sm relative">
  <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8 py-4 overflow-visible">
          <a href="/" className="text-3xl font-extrabold tracking-wide text-gray-900 dark:text-gray-100 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 notranslate" translate="no">
            Credexa
          </a>

          <div className="hidden lg:flex gap-4 bg-gray-200/50 dark:bg-gray-800/50 p-2 rounded-full relative z-[1001]">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onMouseOver={() => setHoveredPath(item.href)}
                onMouseLeave={() => setHoveredPath(pathname)}
                className={linkClass(item.href)}
              >
                {item.href === hoveredPath && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-white dark:bg-gray-600 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <item.icon size={18} />
                  {item.label}
                </span>
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-5">
            <LanguageSwitcher />
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
          </div>

          <div className="lg:hidden flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            <button
              onClick={() => setMobileOpen(true)}
              className="focus:outline-none z-50"
              aria-label="Toggle menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              variants={menuPanelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm z-50 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Menu</h2>
                <button onClick={() => setMobileOpen(false)} className="focus:outline-none" aria-label="Close menu">
                  <X className="w-7 h-7" />
                </button>
              </div>
              <div className="flex flex-col gap-2 px-6 py-4">
                {navItems.map((item) => (
                  <motion.div key={item.href} variants={menuItemVariants}>
                    <a href={item.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(item.href)}>
                      <item.icon size={22} />
                      {item.label}
                    </a>
                  </motion.div>
                ))}
                <div className="pt-2">
                  <LanguageSwitcher />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
