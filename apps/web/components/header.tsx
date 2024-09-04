import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/cn";
import { useChain } from "@/hooks/useChain";
import { truncateWalletAddress } from "@/lib/utils";

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

  const { client, chain, wallet } = useChain();

  return (
    <header className="flex justify-center border-b p-2 shadow-sm">
      <div className="w-full max-w-7xl flex justify-between items-center">
        <div className="flex items-center">
          <h1 className={cn(montserrat.className, 'text-xl font-semibold')}>Zero<span className="text-primary font-bold">Poll</span></h1>
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <div className="flex-grow">
            <Chain height={chain.block?.height ?? "-"} />
          </div>
        </div>
        <div>
          {/* wallet */}
          <Button loading={client.loading} onClick={wallet.connectWallet}>
            {wallet.wallet ? (
              <div className="text-xs sm:text-sm">
                {truncateWalletAddress(wallet.wallet)}
              </div>
            ) : (
              <div className="text-sm">
                Connect wallet
              </div>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
