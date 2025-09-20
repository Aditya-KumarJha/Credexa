import { ExternalLink } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText: string;
}

export default function StatCard({ icon, title, description, linkText }: StatCardProps) {
  return (
    <div className="p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
      {icon}
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {description}{" "}
        <a href="#" className="text-cyan-500 hover:underline">
          {linkText} <ExternalLink className="inline h-3 w-3" />
        </a>
      </p>
    </div>
  );
}
