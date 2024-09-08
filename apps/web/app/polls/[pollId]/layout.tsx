export default function PollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      {children}
    </div>
  );
}
