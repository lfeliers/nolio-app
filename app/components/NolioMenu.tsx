"use client";

import { useEffect, useRef, useState } from "react";

export function NolioMenu({ userLabel }: { userLabel: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="font-semibold text-sm hover:text-gray-300 transition-colors"
      >
        Nolio
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-gray-700 bg-gray-900 shadow-xl z-50 p-3 flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">Signed in as</span>
            <span className="text-xs text-green-400 truncate">{userLabel}</span>
          </div>

          <hr className="border-gray-700" />

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded transition-colors"
            >
              Disconnect
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
