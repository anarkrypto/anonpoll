import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authenticate",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      {children}
    </div>
  );
}
