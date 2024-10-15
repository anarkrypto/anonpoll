import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChainStatus } from "./chain-status";
import { Separator } from "./ui/separator";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/cn";
import { truncateWalletAddress } from "@/lib/utils";
import { useAuth } from "@/lib/stores/auth";
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

  const {isAuthenticated, authenticate, loading: loadingAuth} = useAuth()


  const loading = loadingWallet || loadingAuth;
  const showWallet = isAuthenticated && wallet;

  return (
    <header className="flex justify-center border-b bg-white p-2 shadow-sm">
      <div className="flex w-full max-w-7xl items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <h1 className={cn(montserrat.className, "text-xl")}>
              <span className="bg-gradient-to-b from-zinc-600 to-zinc-800 bg-clip-text font-semibold text-transparent">
                Zero
              </span>
              <span className="bg-gradient-to-b from-violet-500 to-violet-700 bg-clip-text font-bold text-transparent">
                Poll
              </span>
            </h1>
          </Link>
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <div className="flex-grow">
            <ChainStatus />
          </div>
        </div>
        <div>
          {/* wallet */}
          <Button loading={loading} onClick={authenticate} variant="secondary">
            {showWallet ? (
              <>
                <div className="hidden text-sm sm:block">
                  {truncateWalletAddress(wallet, 7)}
                </div>
                <div className="text-xs sm:hidden">
                  {truncateWalletAddress(wallet, 4)}
                </div>
              </>
            ) : (
              <div className="text-sm">Connect Wallet</div>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
