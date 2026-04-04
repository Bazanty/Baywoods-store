"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const clothingSizes = [
  { size: "XS", chest: "82–87", waist: "67–72", hip: "87–92" },
  { size: "S", chest: "88–93", waist: "73–78", hip: "93–98" },
  { size: "M", chest: "94–99", waist: "79–84", hip: "99–104" },
  { size: "L", chest: "100–105", waist: "85–91", hip: "105–110" },
  { size: "XL", chest: "106–112", waist: "92–98", hip: "111–117" },
  { size: "XXL", chest: "113–120", waist: "99–106", hip: "118–125" },
];

const shoeConversions = [
  { eu: "38", us: "5", uk: "4.5" },
  { eu: "39", us: "6", uk: "5.5" },
  { eu: "40", us: "7", uk: "6.5" },
  { eu: "41", us: "8", uk: "7.5" },
  { eu: "42", us: "9", uk: "8.5" },
  { eu: "43", us: "10", uk: "9.5" },
  { eu: "44", us: "11", uk: "10.5" },
  { eu: "45", us: "12", uk: "11.5" },
];

export default function SizeGuideModal({ open, onClose }: SizeGuideModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-xl mx-auto bg-cream z-[80] overflow-y-auto max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-stone sticky top-0 bg-cream">
              <h2 className="font-serif text-xl text-ink">Size Guide</h2>
              <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Clothing */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted mb-4">
                  Clothing (cm)
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone">
                      {["Size", "Chest", "Waist", "Hip"].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-semibold text-muted pb-2 pr-4"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clothingSizes.map((row) => (
                      <tr key={row.size} className="border-b border-stone/50">
                        <td className="py-2.5 pr-4 font-medium text-ink">{row.size}</td>
                        <td className="py-2.5 pr-4 text-muted">{row.chest}</td>
                        <td className="py-2.5 pr-4 text-muted">{row.waist}</td>
                        <td className="py-2.5 text-muted">{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Shoes */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted mb-4">
                  Shoes
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone">
                      {["EU", "US", "UK"].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-semibold text-muted pb-2 pr-4"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shoeConversions.map((row) => (
                      <tr key={row.eu} className="border-b border-stone/50">
                        <td className="py-2.5 pr-4 font-medium text-ink">{row.eu}</td>
                        <td className="py-2.5 pr-4 text-muted">{row.us}</td>
                        <td className="py-2.5 text-muted">{row.uk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted">
                If you&apos;re between sizes, we recommend sizing up. For more help, contact us via WhatsApp or chat.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
