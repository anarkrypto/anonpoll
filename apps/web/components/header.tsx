import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChainBlocks } from "./chain-blocks";
import { Separator } from "./ui/separator";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/cn";
import { truncateWalletAddress } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth";
import { useWalletStore } from "@/lib/stores/wallet";
import Link from "next/link";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export interface HeaderProps {
  loading: boolean;
  wallet?: string;
  onConnectWallet: () => void;
  balance?: string;
  balanceLoading: boolean;
  blockHeight?: string;
}

export default function Header() {
  const { wallet, loading: loadingWallet } = useWalletStore();
  const {
    isAuthenticated,
    loading: loadingAuth,
    authenticate,
  } = useAuthStore();

  const loading = loadingWallet || loadingAuth;
  const showWallet = isAuthenticated && wallet;

  return (
    <header className="flex justify-center border-b bg-white p-2 shadow-sm">
      <div className="flex w-full max-w-7xl items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <h1 className={cn(montserrat.className, "text-xl")}>
              <span className="bg-gradient-to-b font-semibold from-zinc-600 to-zinc-800 bg-clip-text text-transparent">Zero</span>
              <span className="font-bold bg-gradient-to-b from-violet-500 to-violet-700 text-transparent bg-clip-text">Poll</span>
            </h1>
          </Link>
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <div className="flex-grow">
            <ChainBlocks />
          </div>
        </div>
        <div>
          {/* wallet */}
          <Button loading={loading} onClick={authenticate} variant="secondary">
            {showWallet ? (
              <div className="text-xs sm:text-sm">
                {truncateWalletAddress(wallet)}
              </div>
            ) : (
              <div className="text-sm">Connect wallet</div>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
