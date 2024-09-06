import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/cn";
import { truncateWalletAddress } from "@/lib/utils";
import { useChainStore } from "@/lib/stores/chain";
import { useAuthStore } from "@/lib/stores/auth";
import { useWalletStore } from "@/lib/stores/wallet";

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
  const blockHeight = useChainStore((state) => state.block?.height);
  const {wallet, loading: loadingWallet} = useWalletStore();
  const { isAuthenticated, loading: loadingAuth, authenticate } = useAuthStore();

  const loading = loadingWallet || loadingAuth;
  const showWallet = isAuthenticated && wallet

  return (
    <header className="flex justify-center border-b bg-white p-2 shadow-sm">
      <div className="flex w-full max-w-7xl items-center justify-between">
        <div className="flex items-center">
          <h1 className={cn(montserrat.className, "text-xl font-semibold")}>
            Zero<span className="font-bold text-primary">Poll</span>
          </h1>
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <div className="flex-grow">
            <Chain height={blockHeight ?? "-"} />
          </div>
        </div>
        <div>
          {/* wallet */}
          <Button loading={loading} onClick={authenticate}>
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
