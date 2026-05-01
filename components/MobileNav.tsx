"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FaBars } from "react-icons/fa";
import ChatSidebar from "@/components/ChatSidebar";

interface Props {
  chats: any[];
  isPro: boolean;
}

export default function MobileNav({ chats, isPro }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="md:hidden">
        <FaBars className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <FaBars className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[280px]">
        <ChatSidebar chats={chats} isPro={isPro} className="border-none" />
      </SheetContent>
    </Sheet>
  );
}
