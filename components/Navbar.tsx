import Link from "next/link";
import { Button } from "./ui/button";
import UserMenu from "./UserMenu";

type NavbarProps = {
  isAuth: boolean;
  user?: any;
  hideSettingsButton?: boolean;
};

export default function Navbar({ isAuth, user, hideSettingsButton }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between p-6 lg:px-8 border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
      <div className="flex lg:flex-1">
        <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
          <span className="font-bold text-2xl tracking-tighter hover:opacity-80 transition">
            <span className="text-primary">Docs</span> Chat.ai
          </span>
        </Link>
      </div>
      <div className="flex flex-1 justify-end items-center gap-4">
        {isAuth ? (
          <>
            {hideSettingsButton ? (
              <Link href="/">
                <Button variant="ghost" className="text-sm font-medium hidden sm:block">Home</Button>
              </Link>
            ) : (
              <Link href="/settings">
                <Button variant="ghost" className="text-sm font-medium hidden sm:block">Settings</Button>
              </Link>
            )}
            <UserMenu user={user} />
          </>
        ) : (
          <Link href="/sign-in">
              <Button variant="ghost" className="text-sm font-medium">Log in</Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
