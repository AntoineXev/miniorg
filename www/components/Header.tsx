import { Logo } from "./Logo";
import { WaitlistForm } from "./WaitlistForm";

export function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-background/80 px-6 py-3 backdrop-blur-xl md:px-12">
      <Logo />
      <WaitlistForm compact />
    </header>
  );
}
