export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-6">MiniOrg</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-xl text-center">
        Votre hub de productivité personnel. Tâches, calendrier et rituels quotidiens.
      </p>
      <a
        href="https://app.miniorg.app"
        className="bg-primary text-white px-8 py-3 rounded-lg text-lg font-medium hover:opacity-90 transition"
      >
        Accéder à l&apos;app
      </a>
    </main>
  )
}
