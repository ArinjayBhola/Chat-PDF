import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Button
        className="cursor-pointer"
        variant={"secondary"}>
        Click
      </Button>
    </div>
  );
}
