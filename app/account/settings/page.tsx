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

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
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
      setPwForm({ current: "", next: "", confirm: "" });
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
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/account" className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="font-serif text-3xl text-ink">Account Settings</h1>
        </div>

        {/* Profile */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h2 className="font-serif text-xl text-ink mb-5">Profile</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={profileForm.firstName} onChange={setP("firstName")} placeholder="Brian" />
              <Input label="Last Name" value={profileForm.lastName} onChange={setP("lastName")} placeholder="Nyakundi" />
            </div>
            <div>
              <label className="label-base">Email</label>
              <input
                value={user?.email ?? ""}
                disabled
                className="input-base opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-muted mt-1">Email cannot be changed here.</p>
            </div>
            <Input label="Phone" type="tel" value={profileForm.phone} onChange={setP("phone")} placeholder="0712 345 678" />

            {profileMsg && (
              <p className={`text-xs px-3 py-2 border ${profileMsg.type === "success" ? "text-forest bg-forest/5 border-forest/20" : "text-danger bg-red-50 border-red-100"}`}>
                {profileMsg.text}
              </p>
            )}

            <Button type="submit" loading={profileSaving}>
              Save Profile
            </Button>
          </form>
        </motion.section>

        <div className="border-t border-stone my-8" />

        {/* Password */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="font-serif text-xl text-ink mb-5">Change Password</h2>
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
                className="absolute right-3 bottom-3.5 text-muted hover:text-ink transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
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
              <p className={`text-xs px-3 py-2 border ${pwMsg.type === "success" ? "text-forest bg-forest/5 border-forest/20" : "text-danger bg-red-50 border-red-100"}`}>
                {pwMsg.text}
              </p>
            )}

            <Button type="submit" loading={pwSaving}>
              Update Password
            </Button>
          </form>
        </motion.section>

        <div className="border-t border-stone my-8" />

        {/* Danger zone */}
        <section>
          <h2 className="font-serif text-xl text-ink mb-4">Sign Out</h2>
          <p className="text-sm text-muted mb-4">You&apos;ll be signed out of your account on this device.</p>
          <button
            onClick={handleSignOut}
            className="text-sm text-danger border border-danger/30 px-5 py-2.5 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </section>
      </div>
    </div>
  );
}
