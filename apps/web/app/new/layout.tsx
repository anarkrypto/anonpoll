export default function NewPollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md p-4">{children}</div>
    </div>
  );
}
