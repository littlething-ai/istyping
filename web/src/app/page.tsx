import Link from "next/link";

const WINDOWS_DOWNLOAD_URL =
  "https://github.com/littlething-ai/istyping/releases/download/v0.1.0/istyping_0.1.0_x64_en-US.msi";

const faqItems = [
  {
    q: "What is IsTyping?",
    a: "IsTyping lets you use your phone as a lightweight input tool for your desktop. Open the desktop app, join the room from your phone, and start typing.",
  },
  {
    q: "Do I need the desktop app?",
    a: "Yes. The desktop app creates the room and receives input from the phone side.",
  },
  {
    q: "Can I use it from my phone browser?",
    a: "Yes. The phone side works directly in the browser, so you do not need a separate mobile app.",
  },
  {
    q: "Is it stable?",
    a: "This is a public alpha. Core flows are usable, but we are still refining edge cases and polishing the experience.",
  },
  {
    q: "Is it open source yet?",
    a: "Yes. IsTyping is now open source on GitHub, and the public alpha will keep evolving in the open.",
  },
  {
    q: "Which platforms are supported?",
    a: "The desktop app is currently available for Windows. The input side works in modern mobile browsers.",
  },
];

const useCases = [
  {
    title: "Keyboard backup",
    body: "Useful when your keyboard is unavailable, inconvenient, or just out of reach.",
  },
  {
    title: "Quick remote input",
    body: "Type from your phone without switching physical keyboards or devices.",
  },
  {
    title: "Presentation and testing",
    body: "Handy for demos, screen recordings, device testing, and temporary setups.",
  },
  {
    title: "Fast pairing",
    body: "Open, scan, join, and start typing without a complicated setup flow.",
  },
];

const featureStrip = [
  "Lightweight desktop app",
  "Room-based pairing",
  "Phone browser input",
  "Quick reconnect flow",
  "Simple control actions",
  "Public alpha, actively improving",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f2eb] text-[#11120f]">
      <section className="relative overflow-hidden border-b border-black/5 bg-[linear-gradient(180deg,#f6f0e6_0%,#efece5_48%,#e8efe8_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(221,84,33,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(9,117,122,0.18),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
          <nav className="mb-16 flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="text-xl font-black tracking-tight text-[#11120f]">
              IsTyping
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#45473f]">
              <a href="#how-it-works" className="transition hover:text-black">
                How it works
              </a>
              <a href="#faq" className="transition hover:text-black">
                FAQ
              </a>
              <Link
                href="/input"
                className="rounded-full border border-black/10 px-4 py-2 font-medium transition hover:border-black/20 hover:bg-white/50"
              >
                Open Web Input
              </Link>
              <a
                href="#download"
                className="rounded-full bg-[#11120f] px-4 py-2 font-semibold text-white transition hover:bg-[#242620]"
              >
                Download
              </a>
            </div>
          </nav>

          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-[#0d777a]/20 bg-[#0d777a]/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.32em] text-[#0d777a]">
                Public Alpha
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-[#11120f] sm:text-6xl lg:text-7xl">
                Turn your phone into a keyboard for your desktop.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#45473f] sm:text-xl">
                Open the desktop app, scan the pairing code, and start typing from your phone.
                Lightweight, fast, and built for quick phone-to-desktop input.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={WINDOWS_DOWNLOAD_URL}
                  className="rounded-full bg-[#d55421] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:brightness-105"
                >
                  Download for Windows
                </a>
                <Link
                  href="/input"
                  className="rounded-full border border-black/10 bg-white/60 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#11120f] transition hover:border-black/20 hover:bg-white"
                >
                  Open Web Input
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#5b5f54]">
                <span>Windows desktop app available now</span>
                <span>Mobile browser input supported</span>
                <span>Simple room-based pairing</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[30px] border border-black/10 bg-[#11120f] p-5 text-white shadow-[0_30px_80px_rgba(17,18,15,0.18)]">
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
                    Desktop app
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">Room 847219</span>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
                  <div className="grid grid-cols-6 gap-2">
                    {["8", "4", "7", "2", "1", "9"].map((digit) => (
                      <div key={digit} className="rounded-2xl bg-white/7 py-4 text-center text-2xl font-black">
                        {digit}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[20px] border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-50">
                    Waiting for phone connection...
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-[0_30px_80px_rgba(17,18,15,0.12)] backdrop-blur">
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-full bg-[#d55421]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#d55421]">
                    Phone input
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#6c7067]">Connected</span>
                </div>
                <div className="rounded-[24px] border border-black/8 bg-[#fbfaf6] p-4">
                  <div className="rounded-[18px] border border-black/6 bg-white p-4 text-sm text-[#2d2f29] shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]">
                    Tap here to type on desktop...
                  </div>
                  <button className="mt-4 w-full rounded-[18px] bg-[linear-gradient(135deg,#0d777a,#3ca764)] py-3 text-sm font-black uppercase tracking-[0.18em] text-white">
                    Send
                  </button>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-[16px] border border-black/8 bg-white px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#41453d]">
                      Backspace
                    </div>
                    <div className="rounded-[16px] border border-black/8 bg-white px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#41453d]">
                      Enter
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-6 rounded-[36px] border border-black/7 bg-white/80 p-8 shadow-[0_24px_100px_rgba(17,18,15,0.06)] lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0d777a]">A simple bridge</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#11120f] sm:text-4xl">
              A simple bridge between your phone and your desktop
            </h2>
          </div>
          <p className="text-base leading-8 text-[#51554c] sm:text-lg">
            Use the desktop app to create a room, then join from your phone and send text instantly.
            The product stays lightweight on the desktop and simple in the browser, so the first run
            feels direct instead of complicated.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#d55421]">How it works</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#11120f] sm:text-4xl">
            Three steps to get typing
          </h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            ["01", "Download the desktop app", "Launch IsTyping on your computer and open the pairing window."],
            ["02", "Scan the code or enter the room", "Use your phone camera or type the room code manually in the browser."],
            ["03", "Start typing", "Send text and simple controls from your phone to your desktop."],
          ].map(([index, title, body]) => (
            <div key={index} className="rounded-[28px] border border-black/8 bg-[#fffdfa] p-6 shadow-[0_20px_60px_rgba(17,18,15,0.05)]">
              <div className="text-sm font-black uppercase tracking-[0.28em] text-[#0d777a]">{index}</div>
              <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-[#11120f]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#54574f]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0d777a]">Why use IsTyping</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#11120f] sm:text-4xl">
            Built for the moments where typing should be easier
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {useCases.map((item) => (
            <div key={item.title} className="rounded-[28px] border border-black/8 bg-white p-6">
              <h3 className="text-xl font-black tracking-[-0.03em] text-[#11120f]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#54574f]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-black/7 bg-[#11120f] py-8 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-3 px-5 sm:px-8 lg:px-10">
          {featureStrip.map((item) => (
            <div key={item} className="text-sm font-semibold tracking-[0.12em] text-white/75">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="download" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-8 rounded-[36px] bg-[linear-gradient(135deg,#0f7f83,#14313d_58%,#11120f_100%)] p-8 text-white shadow-[0_32px_90px_rgba(15,127,131,0.2)] lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200/80">Download</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Download the desktop app
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
              The desktop app manages pairing and receives input from your phone. Start there, then
              join from your mobile browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={WINDOWS_DOWNLOAD_URL}
              className="rounded-full bg-[#f2efe8] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#11120f] transition hover:bg-white"
            >
              Download for Windows
            </a>
              <Link
                href="/input"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Open Web Input
              </Link>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/12 bg-black/20 p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/50">Current availability</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-white/80">
              <p>Current release: Windows</p>
              <p>Mobile input works in modern mobile browsers</p>
              <p>More platforms are planned</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-4 sm:px-8 lg:px-10">
        <div className="grid gap-6 rounded-[32px] border border-black/8 bg-[#f0e7db] p-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#d55421]">Already have a room code?</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#11120f]">
              Open the web input page on your phone
            </h2>
          </div>
          <div className="flex flex-col items-start justify-between gap-6">
            <p className="max-w-2xl text-base leading-8 text-[#4d4f48] sm:text-lg">
              If your desktop app is already running, open the web input page on your phone and join the room.
            </p>
            <Link
              href="/input"
              className="rounded-full bg-[#11120f] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#242620]"
            >
              Open Web Input
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="rounded-[36px] border border-black/8 bg-white p-8 lg:p-10">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0d777a]">Open source on GitHub</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#11120f] sm:text-4xl">
            Follow the project, explore the code, and help improve it
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#54574f] sm:text-lg">
            IsTyping is now open source. You can browse the repository, follow releases, and contribute
            improvements as the public alpha keeps getting polished.
          </p>
          <div className="mt-8">
            <a
              href="https://github.com/littlething-ai/istyping"
              className="inline-flex rounded-full bg-[#11120f] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#242620]"
            >
              View on GitHub
            </a>
          </div>
          <p className="mt-4 text-sm text-[#6a6d63]">
            Public alpha, actively evolving in the open.
          </p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-5 py-4 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#d55421]">FAQ</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#11120f] sm:text-4xl">
            Questions people are likely to ask first
          </h2>
        </div>
        <div className="mt-10 grid gap-4">
          {faqItems.map((item) => (
            <div key={item.q} className="rounded-[26px] border border-black/8 bg-white p-6">
              <h3 className="text-lg font-black tracking-[-0.02em] text-[#11120f]">{item.q}</h3>
              <p className="mt-3 text-sm leading-7 text-[#575b52]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="rounded-[36px] bg-[#11120f] px-8 py-10 text-white shadow-[0_32px_80px_rgba(17,18,15,0.18)] sm:px-10">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-300/80">Ready to try it?</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Download the desktop app and pair your phone in under a minute.
          </h2>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={WINDOWS_DOWNLOAD_URL}
              className="rounded-full bg-[#d55421] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:brightness-110"
            >
              Download for Windows
            </a>
            <Link
              href="/input"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Open Web Input
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/8 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-lg font-black tracking-tight text-[#11120f]">IsTyping</p>
            <p className="mt-2 max-w-sm text-sm leading-7 text-[#62665d]">
              Phone-to-desktop input, now in public alpha.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#565a51]">
            <a href="#faq" className="transition hover:text-black">FAQ</a>
            <Link href="/input" className="transition hover:text-black">Web Input</Link>
            <a href="https://github.com/littlething-ai/istyping" className="transition hover:text-black">GitHub</a>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
