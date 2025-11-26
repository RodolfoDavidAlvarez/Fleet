export default function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200/80 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} AGAVE ENVIRONMENTAL CONTRACTING, INC. All rights reserved.
          </p>
          <p className="text-sm text-slate-500 font-medium">
            Developed by <span className="font-bold text-slate-700">Better Systems</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

