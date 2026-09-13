"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function submit(pin: string, currentEmail: string) {
    if (!currentEmail || pin.length !== 4) return;
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: pin,
    });
    setLoading(false);
    if (error) {
      setError("Email o PIN incorrecto");
      setDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }
    router.push("/");
    router.refresh();
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    const pin = next.join("");
    if (pin.length === 4) {
      submit(pin, email);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 bg-brand-dark">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-white">
            Lead <span className="text-brand-lime">Capturer</span>
          </h1>
          <p className="text-sm text-white/70">
            Captación de leads para ferias y eventos
          </p>
        </div>

        <div className="space-y-4 bg-white rounded-2xl p-6">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") inputRefs.current[0]?.focus();
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-dark"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">PIN</label>
            <div className="flex gap-2 justify-center">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={loading}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-14 h-16 text-center text-2xl font-semibold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-dark disabled:opacity-50"
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          {loading && (
            <p className="text-sm text-gray-500 text-center">Entrando...</p>
          )}
        </div>

        <p className="text-center text-xs text-white/60">
          ¿No tienes acceso? Pídele a tu manager que te dé de alta.
        </p>
      </div>
    </main>
  );
}
