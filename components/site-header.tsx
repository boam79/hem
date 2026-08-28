import Link from "next/link";
import { DEMO_SHARE_ID } from "@/lib/debate";

export function SiteHeader() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3 text-sm">
        <Link href="/" className="font-medium">
          Boardroom
        </Link>
        <Link
          href={`/s/${DEMO_SHARE_ID}`}
          className="text-muted-foreground hover:underline"
        >
          데모 공유
        </Link>
        <Link href="/demo/slide" className="text-muted-foreground hover:underline">
          발표 슬라이드
        </Link>
      </nav>
    </header>
  );
}
