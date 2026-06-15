import Link from "next/link";
import { Button } from "./ui/button";
import UserMenu from "./UserMenu";

import { User } from "next-auth";

type NavbarProps = {
  isAuth: boolean;
  user?: User;
  hideSettingsButton?: boolean;
};

export default function Navbar({ isAuth, user, hideSettingsButton }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between px-6 py-4 md:px-8 border-b border-border bg-background sticky top-0 z-50">
      <div className="flex lg:flex-1">
        <Link href="/" className="flex items-center gap-2 transition-transform duration-200 active:scale-95">
          <span className="font-extrabold text-xl tracking-tight text-foreground select-none">
            <span className="text-primary">Docs</span>Chat.ai
          </span>
        </Link>
      </div>
      <div className="flex flex-1 justify-end items-center gap-4">
        {isAuth ? (
          <>
            <Link href="/chat">
              <Button className="rounded-md text-sm font-medium hidden sm:inline-flex bg-foreground text-background hover:bg-foreground/90 transition-colors">
                Go to Chats
              </Button>
            </Link>
            {hideSettingsButton ? (
              <Link href="/">
                <Button variant="ghost" className="text-sm font-semibold hidden sm:inline-flex">
                  Home
                </Button>
              </Link>
            ) : (
              <Link href="/settings">
                <Button variant="outline" className="text-sm font-semibold hidden sm:inline-flex">
                  Settings
                </Button>
              </Link>
            )}
            <UserMenu user={user!} />
          </>
        ) : (
          <Link href="/sign-in">
            <Button className="rounded-md text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
