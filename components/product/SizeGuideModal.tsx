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
            className="fixed inset-0 bg-ink/50 z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto bg-cream z-[80] overflow-y-auto max-h-[85vh] border border-ink"
          >
            <div className="flex items-center justify-between p-6 border-b border-ink/20 sticky top-0 bg-cream">
              <div>
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">/ Reference</p>
                <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mt-1">Size guide</h2>
              </div>
              <button onClick={onClose} className="w-9 h-9 border border-ink/25 text-ink hover:bg-ink hover:text-cream transition-colors flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-10">
              {/* Clothing */}
              <div>
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">
                  <span className="text-ink">01</span> / Clothing (cm)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ink">
                        {["Size", "Chest", "Waist", "Hip"].map((h) => (
                          <th
                            key={h}
                            className="text-left font-mono text-[10px] tracking-[0.18em] uppercase text-muted pb-3 pr-6"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clothingSizes.map((row) => (
                        <tr key={row.size} className="border-b border-ink/10">
                          <td className="py-3 pr-6 font-mono text-sm tracking-[0.06em] text-ink">{row.size}</td>
                          <td className="py-3 pr-6 font-mono text-xs tabular-nums text-ink/70">{row.chest}</td>
                          <td className="py-3 pr-6 font-mono text-xs tabular-nums text-ink/70">{row.waist}</td>
                          <td className="py-3 font-mono text-xs tabular-nums text-ink/70">{row.hip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shoes */}
              <div>
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">
                  <span className="text-ink">02</span> / Shoes
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ink">
                        {["EU", "US", "UK"].map((h) => (
                          <th
                            key={h}
                            className="text-left font-mono text-[10px] tracking-[0.18em] uppercase text-muted pb-3 pr-6"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shoeConversions.map((row) => (
                        <tr key={row.eu} className="border-b border-ink/10">
                          <td className="py-3 pr-6 font-mono text-sm tabular-nums text-ink">{row.eu}</td>
                          <td className="py-3 pr-6 font-mono text-xs tabular-nums text-ink/70">{row.us}</td>
                          <td className="py-3 font-mono text-xs tabular-nums text-ink/70">{row.uk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted leading-relaxed border-t border-ink/15 pt-4">
                / Between sizes? Size up. WhatsApp the team for personal sizing help.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
