import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X, Trash2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        >
          <div className="p-5 flex flex-col items-center text-center">
            <div
              className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${isDestructive ? "bg-red-100 text-red-500" : "bg-indigo-100 text-indigo-500"}`}
            >
              {isDestructive ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <h2 className="font-extrabold text-slate-800 text-lg mb-2">
              {title}
            </h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              {message}
            </p>
            <div className="w-full flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-2.5 text-white rounded-xl font-bold transition shadow-sm ${
                  isDestructive
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
