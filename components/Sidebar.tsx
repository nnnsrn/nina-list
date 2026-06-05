"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/check", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.loggedIn);
        setLoading(false);
      })
      .catch(() => {
        setIsAdmin(false);
        setLoading(false);
      });
  }, []);

  const links = [
    { name: "Dashboard", href: "/admin", icon: "dashboard", adminOnly: true },
    { name: "Anime List", href: "/library?type=Anime", icon: "movie" },
    { name: "Manga List", href: "/library?type=Manga", icon: "book" },
    { name: "Manhwa List", href: "/library?type=Manhwa", icon: "auto_stories" },
    { name: "Manhua List", href: "/library?type=Manhua", icon: "import_contacts" },
    { name: "Social Hub", href: "/community", icon: "groups" },
  ];

  const filteredLinks = links.filter((link) => !link.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-container-lowest/80 backdrop-blur-2xl border-r border-outline-variant/10 shadow-2xl py-8 z-40">
        {/* Brand Header (icon removed) */}
        <div className="px-6 mb-10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30">
          </div>
          <div>
            <h1 className="font-plus-jakarta text-md font-bold tracking-tight text-primary">
              {loading ? "NinaList" : isAdmin ? "NinaList Admin" : "NinaList"}
            </h1>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href || (link.href.includes("?") && pathname + link.href.substring(link.href.indexOf("?")) === link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-6 py-4 transition-all duration-200 ${
                  isActive
                    ? "bg-primary-container/10 text-primary border-r-4 border-primary"
                    : "text-on-surface-variant hover:bg-surface-variant/30 hover:translate-x-1"
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}>
                  {link.icon}
                </span>
                <span className="font-label-md text-sm">{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto flex flex-col gap-2 border-t border-outline-variant/10 pt-4">
          {!loading && isAdmin ? (
            <Link
              href="/api/admin/logout"
              className="flex items-center gap-3 text-on-surface-variant px-6 py-4 hover:bg-surface-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-md text-sm">Sign Out</span>
            </Link>
          ) : !loading ? (
            <Link
              href="/signin"
              className="flex items-center gap-3 text-on-surface-variant px-6 py-4 hover:bg-surface-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined">login</span>
              <span className="font-label-md text-sm">Sign In</span>
            </Link>
          ) : null}
          <Link href="/" className="flex items-center gap-3 text-error px-6 py-4 hover:bg-error/10 transition-colors text-left w-full">
            <span className="material-symbols-outlined">home</span>
            <span className="font-label-md text-sm">Return Home</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 w-full h-16 bg-surface-container-low/90 backdrop-blur-xl border-t border-outline-variant/10 z-50 flex justify-around items-center px-4 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        {filteredLinks.slice(0, 4).map((link) => {
          const isActive = pathname === link.href || (link.href.includes("?") && pathname + link.href.substring(link.href.indexOf("?")) === link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center w-12 h-12 relative ${
                isActive ? "text-primary" : "text-on-surface-variant hover:text-primary transition-colors"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              )}
              <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}>
                {link.icon}
              </span>
            </Link>
          );
        })}
        <Link
          href="/"
          className="flex flex-col items-center justify-center w-12 h-12 text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined mb-1">home</span>
        </Link>
      </div>
    </>
  );
}
