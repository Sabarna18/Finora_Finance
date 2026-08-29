import type { ReactNode } from "react";


interface SummaryCardProps {

  title: string;

  value: string | number;

  icon: ReactNode;

  subtitle?: string;

}


export default function SummaryCard({
  title,
  value,
  icon,
  subtitle,
}: SummaryCardProps) {

  return (

    <div
      className="
        rounded-3xl
        border
        border-zinc-800/60
        bg-zinc-950
        p-6
      "
    >

      <div
        className="
          flex
          items-start
          justify-between
        "
      >

        <div>

          <p
            className="
              text-sm
              font-medium
              text-zinc-500
            "
          >
            {title}
          </p>

          <h3
            className="
              mt-4
              text-3xl
              font-bold
              tracking-tight
              text-white
            "
          >
            {value}
          </h3>

        </div>

        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center

            rounded-2xl

            bg-zinc-900
            text-zinc-200
          "
        >

          {icon}

        </div>

      </div>


      {subtitle && (

        <p
          className="
            mt-6
            text-xs
            text-zinc-500
          "
        >
          {subtitle}
        </p>

      )}

    </div>

  );

}