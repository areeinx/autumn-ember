"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <header className="w-full flex flex-col justify-center items-center min-h-[75vh] relative bg-black">
      <Image 
        src="/assets/Header.png" 
        alt="Autumn Ember Logo" 
        width={1000}  
        height={800}  
        priority
        className="w-full max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl" 
        style={{ objectFit: 'contain' }}
      />
      <span
        className="absolute left-[57%] top-[89%] -translate-x-1/2 -translate-y-1/2 text-[#ffb84d] font-bold text-base md:text-lg lg:text-3xl cursor-pointer"
        style={{ fontFamily: 'inherit' }}
        onClick={() => router.push("/fire")}
      >
        Start fire
      </span>
    </header>
  );
}