export default function ThankYouPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/server-restaurant.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="max-w-2xl mx-auto py-8 px-8 bg-gray-500/30 rounded-2xl backdrop-blur-sm flex flex-col justify-between min-h-[300px]">
            <div>
              <h1 className="text-lg md:text-xl font-normal text-white text-balance leading-tight">
                Thanks so much! We'll be in touch soon.
              </h1>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-white leading-relaxed max-w-xl mx-auto mb-3">
                Please share{" "}
                <a
                  href="https://clipboard-served.vercel.app/"
                  className="underline hover:text-gray-200 transition-colors"
                >
                  Served
                </a>{" "}
                with your network 🙏🏽
              </p>
              <p className="text-sm md:text-base text-white leading-relaxed max-w-xl mx-auto mb-4">
                It's the fastest way to help us get <strong>you</strong> connected to great restaurants!
              </p>
            </div>
            <div className="text-xs md:text-sm text-gray-300 italic mt-4">
              Questions? Email emily@clipboardworks.com
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
