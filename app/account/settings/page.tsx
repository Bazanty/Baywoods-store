"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PushToggle from "@/components/account/PushToggle";

export default function SettingsPage() {
  const { user, signOut } = useAuthStore();
  const router = useRouter();
  const meta = user?.user_metadata ?? {};

  const [profileForm, setProfileForm] = useState({
    firstName: meta.first_name ?? "",
    lastName: meta.last_name ?? "",
    phone: meta.phone ?? "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [emailForm, setEmailForm] = useState(user?.email ?? "");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [pwForm, setPwForm] = useState({ next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        phone: profileForm.phone.trim(),
      },
    });
    setProfileSaving(false);
    setProfileMsg(
      error
        ? { type: "error", text: error.message }
        : { type: "success", text: "Profile updated." }
    );
  };

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    const next = emailForm.trim().toLowerCase();
    if (!next || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setEmailMsg({ type: "error", text: "Enter a valid email address." });
      return;
    }
    if (next === (user?.email ?? "").toLowerCase()) {
      setEmailMsg({ type: "error", text: "That's already your email." });
      return;
    }
    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email: next });
    setEmailSaving(false);
    if (error) {
      setEmailMsg({ type: "error", text: error.message });
    } else {
      setEmailMsg({
        type: "success",
        text: "Check your new inbox to confirm. You'll keep signing in with the old email until then.",
      });
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.next.length < 8) {
      setPwMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwSaving(false);
    if (error) {
      setPwMsg({ type: "error", text: error.message });
    } else {
      setPwForm({ next: "", confirm: "" });
      setPwMsg({ type: "success", text: "Password updated." });
    }
  };

  const setP = (f: keyof typeof profileForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfileForm((s) => ({ ...s, [f]: e.target.value }));

  const setPw = (f: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-8 max-w-2xl">
        <Link href="/account" className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-ink inline-flex items-center gap-1 mb-2">
          <ChevronLeft size={12} /> Account
        </Link>
        <div className="border-b border-ink/15 pb-6 mb-10">
          <p className="section-kicker mb-4">SETTINGS</p>
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-5xl">Account.</h1>
        </div>

        {/* Profile */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ 01</p>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mb-6">Profile.</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={profileForm.firstName} onChange={setP("firstName")} placeholder="Brian" />
              <Input label="Last Name" value={profileForm.lastName} onChange={setP("lastName")} placeholder="Nyakundi" />
            </div>
            <Input label="Phone" type="tel" value={profileForm.phone} onChange={setP("phone")} placeholder="0712 345 678" />

            {profileMsg && (
              <p className={`font-mono text-[10px] tracking-[0.14em] uppercase border-l-2 pl-3 py-2 ${profileMsg.type === "success" ? "text-ink border-citrine" : "text-danger border-danger"}`}>
                / {profileMsg.text}
              </p>
            )}

            <Button type="submit" loading={profileSaving}>
              Save profile →
            </Button>
          </form>

          <form onSubmit={handleEmailSave} className="space-y-3 mt-8 pt-8 border-t border-ink/10">
            <Input
              label="Email"
              type="email"
              value={emailForm}
              onChange={(e) => setEmailForm(e.target.value)}
              placeholder="you@email.com"
            />
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
              / We&apos;ll email a confirmation link before switching.
            </p>

            {emailMsg && (
              <p className={`font-mono text-[10px] tracking-[0.14em] uppercase border-l-2 pl-3 py-2 ${emailMsg.type === "success" ? "text-ink border-citrine" : "text-danger border-danger"}`}>
                / {emailMsg.text}
              </p>
            )}

            <Button
              type="submit"
              variant="outline"
              loading={emailSaving}
              disabled={emailForm.trim().toLowerCase() === (user?.email ?? "").toLowerCase()}
            >
              Update email →
            </Button>
          </form>
        </motion.section>

        <div className="border-t border-ink/15 my-10" />

        {/* Password */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10"
        >
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ 02</p>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mb-6">Change password.</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="relative">
              <Input
                label="New Password"
                type={showPw ? "text" : "password"}
                value={pwForm.next}
                onChange={setPw("next")}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-0 bottom-3 text-muted hover:text-ink transition-colors"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Input
              label="Confirm New Password"
              type={showPw ? "text" : "password"}
              value={pwForm.confirm}
              onChange={setPw("confirm")}
              placeholder="Repeat password"
            />

            {pwMsg && (
              <p className={`font-mono text-[10px] tracking-[0.14em] uppercase border-l-2 pl-3 py-2 ${pwMsg.type === "success" ? "text-ink border-citrine" : "text-danger border-danger"}`}>
                / {pwMsg.text}
              </p>
            )}

            <Button type="submit" loading={pwSaving}>
              Update password →
            </Button>
          </form>
        </motion.section>

        <div className="border-t border-ink/15 my-10" />

        {/* Push notifications */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-10"
        >
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ 03</p>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mb-6">Notifications.</h2>
          <PushToggle />
        </motion.section>

        <div className="border-t border-ink/15 my-10" />

        {/* Danger zone */}
        <section>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ 04</p>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mb-3">Sign out.</h2>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-5">/ You&apos;ll be signed out on this device.</p>
          <button
            onClick={handleSignOut}
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-danger border border-danger/30 px-5 py-3 hover:bg-danger hover:text-cream hover:border-danger transition-colors"
          >
            Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
