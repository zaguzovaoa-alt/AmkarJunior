import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

export const HeaderDescription: React.FC<{ text: React.ReactNode }> = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex items-center ml-3 align-middle" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-300 hover:text-emerald-500 transition-colors focus:outline-none flex items-center justify-center p-1 rounded-full hover:bg-emerald-50"
        title="Информация о разделе"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 w-64 md:w-80 p-3 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in duration-200 left-0 sm:left-1/2 sm:-translate-x-1/2 text-left">
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal">
            {text}
          </p>
        </div>
      )}
    </div>
  );
};
