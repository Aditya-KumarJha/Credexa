"use client";

import React from "react";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import UseCase from "@/components/UseCase";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";

const SmoothScrollStyle = () => {
  return (
    <style>
      {`
        html {
          scroll-behavior: smooth;
        }
      `}
    </style>
  );
};

export default function Page() {
  return (
    <div className="bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <SmoothScrollStyle />
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <UseCase />
      <Testimonials />
      <div id="contact">
        <Contact />
      </div>
      <Footer />
    </div>
  );
}
