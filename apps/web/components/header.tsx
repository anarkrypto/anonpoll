import { Button } from "@/components/ui/button";
// @ts-ignore
import truncateMiddle from "truncate-middle";
import { Skeleton } from "@/components/ui/skeleton";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/cn";

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

export default function Header({
  loading,
  wallet,
  onConnectWallet,
  balance,
  balanceLoading,
  blockHeight,
}: HeaderProps) {
  return (
    <header className="flex justify-center border-b p-2 shadow-sm">
      <div className="w-full max-w-7xl flex justify-between items-center">
        <div className="flex items-center">
          <h1 className={cn(montserrat.className, 'text-xl font-semibold')}>Zero<span className="text-primary font-bold">Poll</span></h1>
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <div className="flex-grow">
            <Chain height={blockHeight} />
          </div>
        </div>
        <div>
          {/* wallet */}
          <Button loading={loading} onClick={onConnectWallet}>
            {wallet ? (
              <div className="text-xs sm:text-sm">
                {truncateMiddle(wallet, 7, 7, "...")}
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
