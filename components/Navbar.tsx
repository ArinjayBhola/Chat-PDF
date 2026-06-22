import Link from "next/link";
import { Button } from "./ui/button";
import UserMenu from "./UserMenu";
import { LuFileText } from "react-icons/lu";

import { User } from "next-auth";

type NavbarProps = {
  isAuth: boolean;
  user?: User;
  hideSettingsButton?: boolean;
};

export default function Navbar({ isAuth, user, hideSettingsButton }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-6 py-3.5 backdrop-blur-md md:px-8">
      <div className="flex lg:flex-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform duration-200 active:scale-95">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <LuFileText className="h-5 w-5" />
          </span>
          <span className="select-none text-lg font-bold tracking-tight text-foreground">
            Docs<span className="text-primary">Chat</span>
          </span>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2.5">
        {isAuth ? (
          <>
            <Link href="/chat">
              <Button className="hidden text-sm font-semibold sm:inline-flex">Go to Chats</Button>
            </Link>
            {hideSettingsButton ? (
              <Link href="/">
                <Button
                  variant="ghost"
                  className="hidden text-sm font-semibold sm:inline-flex">
                  Home
                </Button>
              </Link>
            ) : (
              <Link href="/settings">
                <Button
                  variant="outline"
                  className="hidden text-sm font-semibold sm:inline-flex">
                  Settings
                </Button>
              </Link>
            )}
            <UserMenu user={user!} />
          </>
        ) : (
          <Link href="/sign-in">
            <Button className="text-sm font-semibold">Sign In</Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
