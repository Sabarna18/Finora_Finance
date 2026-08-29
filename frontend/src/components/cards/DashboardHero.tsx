import {
  Sparkles,
} from "lucide-react";


export default function DashboardHero() {

  return (

    <section
      className="
        relative
        overflow-hidden

        rounded-3xl

        border
        border-zinc-800/60

        bg-gradient-to-br
        from-zinc-950
        via-zinc-900
        to-violet-950/30

        p-8
        lg:p-10
      "
    >

      <div
        className="
          absolute
          -top-24
          right-0

          h-64
          w-64

          rounded-full

          bg-violet-500/10
          blur-3xl
        "
      />

      <div
        className="
          relative
          z-10
        "
      >

        <div
          className="
            inline-flex
            items-center
            gap-2

            rounded-full

            border
            border-zinc-700/60

            bg-zinc-900/80

            px-3
            py-1.5
          "
        >

          <Sparkles
            size={14}
            className="
              text-violet-400
            "
          />

          <span
            className="
              text-xs
              font-medium
              text-zinc-300
            "
          >
            Financial Dashboard
          </span>

        </div>


        <h1
          className="
            mt-5

            text-3xl
            font-bold
            tracking-tight
            text-white

            lg:text-5xl
          "
        >
          Welcome back 👋
        </h1>

        <p
          className="
            mt-4

            max-w-2xl

            text-sm
            leading-7
            text-zinc-400

            lg:text-base
          "
        >
          Monitor your finances, track spending,
          and analyse your savings in real-time.
        </p>

      </div>

    </section>

  );

}