"use client";

import { motion } from "framer-motion";
import { UserPlus, Upload, ShieldCheck, Share2 } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Sign Up & Connect",
      desc: "Create your Credexa account and link your learning history from multiple platforms.",
      icon: <UserPlus />,
    },
    {
      step: "2",
      title: "Upload & Aggregate",
      desc: "Import micro-credentials, certificates, and achievements into one unified profile.",
      icon: <Upload />,
    },
    {
      step: "3",
      title: "Verify & Secure",
      desc: "Your credentials are authenticated and stored on blockchain for tamper-proof security.",
      icon: <ShieldCheck />,
    },
    {
      step: "4",
      title: "Share & Showcase",
      desc: "Present your verified skill passport to employers, universities, or on social media.",
      icon: <Share2 />,
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="container mx-auto px-6 pb-20">
      <h2 className="text-4xl font-bold mb-16 text-center">
        How <span className="text-blue-600 dark:text-blue-400">Credexa</span> Works
      </h2>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        variants={containerVariants}
        className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 md:gap-8"
      >
        {/* Connector line (desktop only) */}
        <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-gray-300 dark:border-zinc-600"></div>

        {steps.map((s, idx) => (
          <motion.div
            key={idx}
            variants={cardVariants}
            className="relative z-10 flex flex-col items-center text-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300
                       bg-white border-gray-200 hover:shadow-xl hover:-translate-y-2
                       dark:bg-zinc-900 dark:border-zinc-700 w-full"
          >
            <div className="absolute -top-8 flex items-center justify-center text-xl text-white bg-blue-600 dark:bg-blue-500 border-4 border-white dark:border-zinc-900 rounded-full w-16 h-16 font-bold">
              {s.step}
            </div>
            <div className="text-4xl text-blue-600 dark:text-blue-400 mt-10 mb-2">{s.icon}</div>
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
