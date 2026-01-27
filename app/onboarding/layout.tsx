export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-tauri-drag-region={true} className="h-screen w-screen overflow-hidden bg-white">
      {children}
    </div>
  );
}
