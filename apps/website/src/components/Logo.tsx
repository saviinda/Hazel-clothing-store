import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'header' | 'footer' | 'default';
  href?: string | null;
  /** Pass 'dark' when the logo sits on a dark/coloured background (e.g. sidebar) */
  variant?: 'light' | 'dark';
}

const SIZES = {
  header: { outer: 'h-[56px] w-[56px] sm:h-[60px] sm:w-[60px] md:h-[64px] md:w-[64px]', inner: 'h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] md:h-[56px] md:w-[56px]', img: 240 },
  footer: { outer: 'h-[80px] w-[80px]', inner: 'h-[68px] w-[68px]', img: 288 },
  default: { outer: 'h-[72px] w-[72px]', inner: 'h-[62px] w-[62px]', img: 256 },
};


export default function Logo({ className = '', size = 'default', href = '/' }: LogoProps) {
  const { outer, img } = SIZES[size];

  const image = (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden ${outer} ${className}`}
    >
      <Image
        src="/logo.png"
        alt="Hazel Clothing Boutique"
        width={img}
        height={img}
        className="h-full w-full object-cover object-center"
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
