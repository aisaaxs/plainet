"use client";

import { Audiowide } from "next/font/google";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faEnvelope, faGear, faX } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { usePathname } from "next/navigation";

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
});

const options = [
  { label: "Dashboard", href: "/" },
  { label: "PlaiBot", href: "/plaibot" },
  { label: "Insights", href: "/insights" },
  { label: "Milestone Hub", href: "/milestone-hub" },
];

export default function Navbar() {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const pathname = usePathname();

  return (
    <div className="relative">
      <div className="w-full h-full bg-blue-600 px-6 py-3 flex flex-row justify-start items-center">
        <div className={`text-white ${audiowide.className} font-extrabold text-3xl mr-auto`}>
          PlaiNet
        </div>

        <div className="flex flex-row justify-center items-center mx-auto h-full rounded-md gap-x-4 bg-white/20 px-4 max-md:hidden">
          {options.map((option, index) => (
            <Link
              key={index}
              href={option.href}
              className={`font-sans font-bold text-lg capitalize h-full flex justify-center items-center px-2 ${pathname === option.href ? "bg-yellow-300 text-black" : "text-white hover:bg-white/20"}`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto h-full flex flex-row justify-center items-center gap-x-8 px-2 max-md:hidden">
          <Link href="/settings" className="relative group">
            <FontAwesomeIcon icon={faGear} className="text-white hover:scale-125 text-xl" />
            <div className="absolute bottom-[-40] left-1/2 transform -translate-x-1/2 bg-black p-2 py-1 flex justify-center items-center text-white text-md font-sans font-bold capitalize rounded-lg not-group-hover:hidden border border-white">
              settings
            </div>
          </Link>

          <Link href="/profile" className="relative group">
            <FontAwesomeIcon icon={faEnvelope} className="text-white hover:scale-125 text-xl" />
            <div className="absolute bottom-[-40] left-1/2 transform -translate-x-1/2 bg-black p-2 py-1 flex justify-center items-center text-white text-md font-sans font-bold capitalize rounded-lg not-group-hover:hidden border border-white">
              inbox
            </div>
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden text-white cursor-pointer text-xl"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <FontAwesomeIcon icon={showSidebar ? faX : faBars} />
        </button>
      </div>

      <div
        className={`fixed top-0 right-0 w-full h-full bg-blue-600 transition-transform duration-300 transform ${
          showSidebar ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4">
          <button
            type="button"
            onClick={() => setShowSidebar(false)}
            className="text-white text-xl mb-8"
          >
            <FontAwesomeIcon icon={faX} className="cursor-pointer" />
          </button>
          <ul className="space-y-4">
            {options.map((option, index) => (
              <li key={index} className={`px-2 ${pathname === option.href ? "hover:text-black bg-yellow-300" : "text-white hover:bg-white/20"}`}>
                <Link
                  href={option.href}
                  onClick={() => setShowSidebar(false)}
                  className="text-2xl"
                >
                  {option.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
