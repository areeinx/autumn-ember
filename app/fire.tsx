import Image from "next/image";

export default function FirePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="relative flex items-center justify-center" style={{ width: 400, height: 400 }}>
        {/* Halo/Glow effect */}
        <div
          className="absolute rounded-full"
          style={{
            width: 340,
            height: 340,
            top: 30,
            left: 30,
            background: "radial-gradient(circle, rgba(255,184,77,0.5) 0%, rgba(255,184,77,0.1) 60%, transparent 100%)",
            filter: "blur(24px)",
            zIndex: 1,
          }}
        />
        {/* Fire GIF */}
        <Image
          src="/Flame.gif"
          alt="Fire animation"
          width={500}
          height={500}
          style={{ zIndex: 2, position: "relative" }}
          priority
        />
      </div>
      {/* Add additional UI elements here as needed */}
    </div>
  );
}
