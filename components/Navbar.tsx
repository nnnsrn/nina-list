"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/admin/check", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.loggedIn);
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  const navItems = [
    { name: "Discover", href: "/" },
    { name: "Library", href: "/library" },
    { name: "Community", href: "/community" },
    isAdmin
      ? { name: "Dashboard", href: "/admin" }
      : { name: "Sign In", href: "/signin" },
  ];

  return (
    <nav className="fixed top-0 w-full bg-background/60 backdrop-blur-xl border-b border-outline-variant/10 z-50 transition-all duration-300">
      <div className="max-w-container-max mx-auto px-5 md:px-16 h-20 flex items-center justify-between">
        {/* Brand Logo (icon removed) */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-plus-jakarta text-xl font-bold tracking-wider text-primary">
            NINALIST
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`font-label-md text-sm tracking-wider uppercase transition-colors py-2 px-1 ${
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search database..."
              className="bg-surface-container-low border border-outline-variant/20 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 w-48 transition-all group-hover:border-outline-variant/50"
            />
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-lg">
              search
            </span>
          </div>
          <button className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 hover:border-primary/60 transition-all">
            <img
              src="https://lh3.googleusercontent.com/a/default-user=s96-c"
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback if image fails
                e.currentTarget.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
              }}
            />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/20 text-on-surface hover:bg-surface-variant/20 transition-all"
        >
          <span className="material-symbols-outlined">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-outline-variant/10 px-5 py-6 flex flex-col gap-4 animate-wave">
          <div className="relative w-full mb-2">
            <input
              type="text"
              placeholder="Search database..."
              className="bg-surface-container-low border border-outline-variant/20 rounded-full py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-primary/50 w-full"
            />
            <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant text-lg">
              search
            </span>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-label-md text-base py-2 transition-colors ${
                  isActive ? "text-primary font-bold" : "text-on-surface-variant"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
