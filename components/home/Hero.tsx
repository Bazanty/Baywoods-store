import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";

const metaLinks = [
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "TikTok", href: "https://www.tiktok.com/" },
];

export default function Hero() {
  return (
    <section className="relative isolate min-h-[calc(100svh-3.5rem)] overflow-hidden bg-[#d8d7d4] pt-14 text-[#1c1b1a] lg:min-h-[calc(100svh-4rem)] lg:pt-16">
      <style>
        {`
          @keyframes baywoods-drift {
            from { transform: translate3d(0, 0, 0) scale(1); }
            to { transform: translate3d(4%, 3%, 0) scale(1.06); }
          }

          @keyframes baywoods-float {
            from { transform: translate3d(0, 0, 0) rotate(-8deg); }
            to { transform: translate3d(0, -2.5%, 0) rotate(-6deg); }
          }

          @media (prefers-reduced-motion: no-preference) {
            .baywoods-drift {
              animation: baywoods-drift 9s ease-in-out infinite alternate;
            }

            .baywoods-float {
              animation: baywoods-float 6s ease-in-out infinite alternate;
            }
          }
        `}
      </style>

      <div aria-hidden className="absolute inset-0 -z-30 grid lg:grid-cols-2">
        <div className="bg-[#c7c6c3]" />
        <div className="bg-[#d8d7d4]" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />

      <h1 className="pointer-events-none absolute left-4 top-20 z-0 select-none font-display text-7xl font-semibold uppercase leading-[0.86] text-[#f3f1ee] shadow-black/20 sm:left-8 sm:text-8xl md:text-9xl lg:left-14 lg:top-20 lg:text-[10rem] xl:text-[12rem]">
        Baywoods
      </h1>

      <div className="relative z-10 grid min-h-[calc(100svh-3.5rem)] grid-rows-[0.9fr_1.1fr] lg:min-h-[calc(100svh-4rem)] lg:grid-cols-2 lg:grid-rows-1">
        <div className="relative flex min-h-[22rem] flex-col justify-end px-5 pb-8 pt-28 sm:px-8 lg:min-h-0 lg:px-16 lg:pb-14">
          <div
            aria-hidden
            className="baywoods-drift absolute -left-[12%] top-[3%] h-[70%] w-[95%] rounded-[45%] bg-[radial-gradient(45%_55%_at_62%_40%,rgba(224,75,26,0.55),transparent_70%),radial-gradient(70%_80%_at_40%_55%,#181614_0%,#242120_55%,transparent_78%)] blur-3xl"
          />
          <div
            aria-hidden
            className="absolute bottom-[10%] left-0 h-[38%] w-[95%] bg-[radial-gradient(80%_90%_at_40%_50%,rgba(20,18,17,0.82),transparent_75%)] blur-2xl"
          />

          <p className="relative z-10 max-w-[31rem] text-base font-medium leading-7 text-[#f3f1ee] drop-shadow-[0_1px_14px_rgba(0,0,0,0.45)] sm:text-lg">
            We source standout footwear with bold contrasts and timeless
            silhouettes. Every pair turns the everyday step into a statement.
          </p>

          <div className="relative z-10 mt-7 flex flex-wrap items-end gap-x-8 gap-y-4 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3835] sm:mt-9">
            <div className="flex flex-col gap-2">
              <span className="text-[#7a7771]">Est. 2026 / KE</span>
              <Link
                href="/shop/shoes"
                className="group inline-flex items-center gap-2 border-b border-[#e04b1a] pb-1 text-[#e04b1a] transition-colors hover:text-[#1c1b1a]"
              >
                Explore shoes
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="hidden flex-col gap-2 sm:flex">
              {metaLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="transition-colors hover:text-[#e04b1a]"
                >
                  + {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden flex-col gap-2 text-[#7a7771] xl:flex">
              <span>Nairobi ready</span>
              <span>Open daily 9-21</span>
            </div>
          </div>

          <span
            aria-hidden
            className="absolute left-[88%] top-[55%] z-20 text-sm text-[#8d8a85]"
          >
            +
          </span>
          <span
            aria-hidden
            className="absolute left-[90%] top-[8%] z-20 h-2 w-2 animate-pulse bg-[#e04b1a]"
          />
        </div>

        <div className="relative flex min-h-[26rem] items-center justify-center overflow-hidden px-4 pb-14 sm:px-8 lg:min-h-0 lg:px-10 lg:pb-0">
          <div
            aria-hidden
            className="absolute inset-x-[12%] top-[18%] h-[46%] rounded-full bg-[radial-gradient(circle,rgba(255,122,48,0.45),rgba(255,122,48,0)_68%)] blur-2xl"
          />
          <div
            aria-hidden
            className="absolute bottom-[17%] left-1/2 h-12 w-[70%] -translate-x-1/2 rounded-full bg-[#1c1b1a]/20 blur-2xl"
          />

          <div className="baywoods-float relative z-10 h-[22rem] w-full max-w-[38rem] sm:h-[28rem] lg:h-[34rem] xl:h-[38rem]">
            <Image
              src="/hero-shoe-airmax95.png"
              alt="Nike Air Max 95 sneaker"
              fill
              priority
              sizes="(max-width: 768px) 92vw, 48vw"
              className="object-contain drop-shadow-[0_42px_55px_rgba(0,0,0,0.36)]"
            />
          </div>

          <div className="pointer-events-none absolute bottom-0 right-2 z-20 select-none font-display text-7xl font-semibold uppercase leading-none text-[#f5f4f2] drop-shadow-[0_4px_40px_rgba(0,0,0,0.22)] sm:text-8xl md:text-9xl lg:right-5 lg:text-[10rem] xl:text-[12rem]">
            Store
          </div>

          <div className="absolute right-4 top-7 z-20 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#75726d] sm:right-8 lg:top-10">
            <ShoppingBag size={13} />
            <span>FW26 / Drop 01</span>
          </div>

          <span
            aria-hidden
            className="absolute left-[8%] top-[46%] z-20 text-sm text-[#8d8a85]"
          >
            +
          </span>
          <span
            aria-hidden
            className="absolute right-[10%] top-[12%] z-20 h-2 w-2 animate-pulse bg-[#e04b1a]"
          />
          <span
            aria-hidden
            className="absolute right-[5%] top-[50%] z-20 h-2 w-2 animate-pulse bg-[#e04b1a]"
          />
        </div>
      </div>
    </section>
  );
}
