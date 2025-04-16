import { Film } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Film className="text-primary h-5 w-5 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Video Summarizer</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="#">
              <a className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Terms</a>
            </Link>
            <Link href="#">
              <a className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Privacy</a>
            </Link>
            <Link href="#">
              <a className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Contact</a>
            </Link>
            <span>© {new Date().getFullYear()} Video Summarizer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
