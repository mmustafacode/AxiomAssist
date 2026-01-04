import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="h-[100dvh] w-full bg-background relative overflow-y-auto overflow-x-hidden">
      <div className="min-h-full flex flex-col items-center justify-center p-4">
        {/* Background Gradients */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob fixed pointer-events-none"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 fixed pointer-events-none"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000 fixed pointer-events-none"></div>

        <div className="max-w-3xl text-center space-y-8 relative z-10 mt-10 md:mt-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-purple-500/30 text-sm font-medium text-foreground/90 backdrop-blur-md shadow-sm animate-in fade-in zoom-in duration-500">
            <Sparkles size={16} className="text-yellow-400 fill-yellow-400" />
            <span>More than just AI — A Friend</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent pb-2 drop-shadow-sm">
            Your Digital<br />Best Friend 🌟
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
            I'm <span className="font-semibold text-foreground">AxiomAssist</span>, here to chat, laugh, and help you out! 🚀
            <br className="hidden md:block" />
            From solving problems to just hanging out, I'm always here for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link
              href={session ? "/chat" : "/auth/signin"}
              className="px-8 py-4 bg-primary text-primary-foreground text-lg rounded-full font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg hover:translate-y-[-2px]"
            >
              Say Hello 👋
              <ArrowRight size={20} />
            </Link>
            <Link
              href="https://github.com/mmustafacode/AxiomAssist.git"
              className="px-8 py-4 bg-secondary text-secondary-foreground text-lg rounded-full font-semibold hover:bg-secondary/80 transition-all"
            >
              See How I Work
            </Link>
          </div>
        </div>

        {/* Demo UI Mockup */}
        <div className="mt-16 w-full max-w-4xl p-2 rounded-2xl bg-gradient-to-b from-foreground/10 to-transparent backdrop-blur-sm relative z-10 mb-10">
          <div className="rounded-xl bg-card border border-border shadow-2xl overflow-hidden aspect-video relative">
            <img
              src="/product-demo.png"
              alt="AxiomAssist Interface"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {/* Footer */}
        <footer className="w-full text-center mt-12 mb-4 opacity-80 hover:opacity-100 transition-opacity">
          <p className="text-sm font-medium text-muted-foreground">
            Developed with ❤️ by <span className="text-primary font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Mustafa</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
