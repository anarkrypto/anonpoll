import { useNotifyTransactions } from "@/hooks/useNotifyTransaction";
import { Toaster } from "./ui/toaster";

export function TransactionNotifications() {
  useNotifyTransactions();
  return <Toaster />;
}
