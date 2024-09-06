export default function NewPollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center">
      <div className="w-full p-4">{children}</div>
    </div>
  );
}
