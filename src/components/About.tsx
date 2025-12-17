import { ArrowLeft, Leaf, Layers, Hammer, Code, Cpu, Globe } from 'lucide-react';

interface AboutProps {
  onBack: () => void;
}

export function About({ onBack }: AboutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent leading-tight">
              Structure. Strategy. Syntax.
            </h1>
            <p className="text-xl sm:text-2xl text-cyan-400 font-light tracking-wide">
              Welcome to Bitkitekt.
            </p>
          </div>

          <div className="space-y-16">
            <section className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 sm:p-10 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Globe className="w-8 h-8 text-cyan-400" />
                The Name
              </h2>
              <div className="text-slate-300 text-lg leading-relaxed space-y-4">
                <p>
                  The name is a portmanteau of <span className="font-bold text-cyan-400">'Bit'</span> (the fundamental unit of digital information) and <span className="font-bold text-cyan-400">'Arkitekt'</span> (the Scandinavian spelling of Architect).
                </p>
                <p>
                  It represents the philosophy that drives my work: code is not just typed; it is designed. Whether it's a microservice in a distributed cloud environment or a simple component in a React application, the principles of solid foundation and structural integrity remain the same.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-8 text-center">The Mission</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Leaf className="w-7 h-7 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Sustainable Engineering</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Writing code that is readable by humans first and machines second.
                  </p>
                </div>

                <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Cpu className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Modern Patterns</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Testing the limits of new technologies without abandoning time-tested design principles.
                  </p>
                </div>

                <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Hammer className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">The Builder's Mindset</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Moving beyond "ticket taking" to true problem solving.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-8 sm:p-10 shadow-2xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Code className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">The Stack</h2>
                  <p className="text-slate-300 text-lg">
                    This site itself is a living prototype. It is built to be fast, semantic, and structurally sound.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                  <div className="text-sm text-slate-500 mb-1">Frontend</div>
                  <div className="text-white font-semibold">React / Vite</div>
                  <div className="text-xs text-slate-400 mt-1">Hosted on Bolt.new</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                  <div className="text-sm text-slate-500 mb-1">Styling</div>
                  <div className="text-white font-semibold">Tailwind CSS</div>
                  <div className="text-xs text-slate-400 mt-1">Utility-first design</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                  <div className="text-sm text-slate-500 mb-1">Philosophy</div>
                  <div className="text-white font-semibold">Minimal dependencies</div>
                  <div className="text-xs text-slate-400 mt-1">Maximum performance</div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="order-2 md:order-1">
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/profile.jpg`}
                    alt="Corey Magin"
                    className="w-full h-full object-cover min-h-[300px]"
                  />
                </div>
                <div className="order-1 md:order-2 p-8 sm:p-10 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <Layers className="w-8 h-8 text-cyan-400" />
                    The Architect
                  </h2>
                  <div className="text-slate-300 text-lg leading-relaxed space-y-4">
                    <p>
                      My name is <span className="font-bold text-white">Corey Magin</span>. I am a Senior Software Engineer and the founder of <a href="https://www.iciclewebco.com" target="_blank">Icicle Web Co.</a> based in Wenatchee, WA.
                    </p>
                    <p>
                      When I am not architecting software solutions or wrestling with CSS grids, I am likely exploring the Pacific Northwest with my family or restoring second hand items—a reminder that good things are built to last.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
