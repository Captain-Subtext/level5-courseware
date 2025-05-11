export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 md:py-10 px-4">
      {/* Logo and Tagline Section */}
      <div className="flex flex-col items-center justify-center mb-6">
        <img 
          src="https://pjviwnulenjexsxaqlxp.supabase.co/storage/v1/object/public/files/c4nc-transparent.png" 
          alt="Cursor for Non-Coders Logo" 
          className="h-16 w-auto mb-4"
        />
        <div className="bg-gray-800 rounded-lg px-6 py-3 text-center max-w-lg mx-auto">
          <p className="text-white">
            Empowering technical professionals to build amazing applications without coding.
          </p>
        </div>
      </div>
      
      {/* Combined Links Section */}
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mb-6">
        <a href="/" className="hover:text-white transition-colors">Home</a>
        <span className="text-gray-600">|</span>
        <a href="/about" className="hover:text-white transition-colors">About</a>
        <span className="text-gray-600">|</span>
        <a href="/contact" className="hover:text-white transition-colors">Contact</a>
        <span className="text-gray-600">|</span>
        <a href="/changelog" className="hover:text-white transition-colors">Changelog</a>
        <span className="text-gray-600">|</span>
        <a href="/terms" className="hover:text-white transition-colors">Terms</a>
        <span className="text-gray-600">|</span>
        <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
      </div>
      
      {/* Copyright */}
      <div className="text-center text-sm mt-6">
        &copy; {new Date().getFullYear()} Cursor for Non-Coders. All rights reserved.
      </div>
    </footer>
  );
} 