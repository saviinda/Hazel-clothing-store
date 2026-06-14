import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'header' | 'footer' | 'default';
  href?: string | null;
}

const SIZES = {
  header: { box: 'h-14 w-14 sm:h-16 sm:w-16 md:h-[68px] md:w-[68px]', img: 272 },
  footer: { box: 'h-[72px] w-[72px]', img: 288 },
  default: { box: 'h-16 w-16', img: 256 },
};

export default function Logo({ className = '', size = 'default', href = '/' }: LogoProps) {
  const { box, img } = SIZES[size];

  const image = (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-black shadow-sm ring-1 ring-black/10 ${box} ${className}`}
    >
      <Image
        src="/logo.png"
        alt="Hazel Clothing Boutique"
        width={img}
        height={img}
        className="h-full w-full scale-[1.08] object-contain object-center"
        priority
        quality={100}
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center" aria-label="Hazel Clothing Boutique home">
        {image}
      </Link>
    );
  }

  return image;
}
