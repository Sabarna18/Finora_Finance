// ======================================================
// src/pages/LandingPage.tsx
// ======================================================

import {
    Link,
} from "react-router-dom";

import {
    ArrowRight,
    BarChart3,
    Check,
    ChevronRight,
    CircleDollarSign,
    LayoutDashboard,
    LockKeyhole,
    PieChart,
    Receipt,
    ShieldCheck,
    Tags,
    TrendingDown,
    TrendingUp,
    WalletCards,
} from "lucide-react";

import Logo
    from "../components/brands/Logo";


// ======================================================
// DATA
// ======================================================

const features = [
    {
        icon: Receipt,
        title: "Transaction Tracking",
        description:
            "Record income and expenses, organize transactions by category, and keep your financial history in one place.",
    },
    {
        icon: Tags,
        title: "Smart Categories",
        description:
            "Organize income and spending into meaningful categories so your financial activity stays easy to understand.",
    },
    {
        icon: WalletCards,
        title: "Monthly Budgets",
        description:
            "Create category-based budgets, monitor spending, and see how much room you have left throughout the month.",
    },
    {
        icon: LayoutDashboard,
        title: "Financial Dashboard",
        description:
            "Get a concise overview of income, expenses, balances, budgets, and recent financial activity.",
    },
    {
        icon: BarChart3,
        title: "Reports & Analytics",
        description:
            "Explore cash flow, income-versus-expense trends, category breakdowns, and budget performance.",
    },
    {
        icon: ShieldCheck,
        title: "Private Account",
        description:
            "Your financial records are associated with your authenticated account and protected behind secure application access.",
    },
];


const reportFeatures = [
    "Cash-flow analysis",
    "Income vs expense trends",
    "Category spending breakdown",
    "Budget performance tracking",
];


const productPoints = [
    "Track income and expenses",
    "Organize transactions by category",
    "Create monthly budgets",
    "Review financial reports",
];


// ======================================================
// COMPONENT
// ======================================================

export default function LandingPage() {

    return (

        <div
            className="
        min-h-screen
        overflow-x-hidden
        bg-zinc-950
        text-white
      "
        >

            {/* ==================================================
          NAVBAR
      ================================================== */}
            <header
                className="
          sticky
          top-0
          z-50

          border-b
          border-zinc-800/70

          bg-zinc-950/80
          backdrop-blur-xl
        "
            >

                <div
                    className="
            mx-auto

            flex
            h-20
            max-w-7xl

            items-center
            justify-between

            px-5
            sm:px-6
            lg:px-8
          "
                >

                    {/* BRAND */}

                    <Link
                        to="/"
                        aria-label="Finora home"
                        className="
              rounded-xl

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-violet-500
            "
                    >

                        <Logo
                            variant="brand"
                            size="md"
                        />

                    </Link>


                    {/* DESKTOP NAV */}

                    <nav
                        className="
              hidden
              items-center
              gap-8

              md:flex
            "
                    >

                        <a
                            href="#features"
                            className="
                text-sm
                font-medium
                text-zinc-400

                transition-colors

                hover:text-white
              "
                        >
                            Features
                        </a>

                        <a
                            href="#analytics"
                            className="
                text-sm
                font-medium
                text-zinc-400

                transition-colors

                hover:text-white
              "
                        >
                            Analytics
                        </a>

                        <a
                            href="#product"
                            className="
                text-sm
                font-medium
                text-zinc-400

                transition-colors

                hover:text-white
              "
                        >
                            Product
                        </a>

                        <Link
                            to="/about"
                            className="
                text-sm
                font-medium
                text-zinc-400

                transition-colors

                hover:text-white
            "
                        >
                            About
                        </Link>

                    </nav>


                    {/* ACTIONS */}

                    <div
                        className="
              flex
              items-center
              gap-2

              sm:gap-3
            "
                    >

                        <Link
                            to="/login"
                            className="
                rounded-xl

                px-3
                py-2.5

                text-sm
                font-semibold

                text-zinc-300

                transition-colors

                hover:text-white

                sm:px-4
              "
                        >
                            Sign in
                        </Link>


                        <Link
                            to="/register"
                            className="
                rounded-xl

                bg-violet-600

                px-4
                py-2.5

                text-sm
                font-semibold

                shadow-lg
                shadow-violet-950/30

                transition-all

                hover:bg-violet-500

                sm:px-5
              "
                        >
                            Get started
                        </Link>

                    </div>

                </div>

            </header>


            <main>

                {/* ==================================================
            HERO
        ================================================== */}
                <section
                    className="
            relative
            overflow-hidden
          "
                >

                    {/* BACKGROUND GLOW */}

                    <div
                        aria-hidden="true"
                        className="
              pointer-events-none

              absolute
              left-1/2
              top-[-300px]

              h-[700px]
              w-[900px]

              -translate-x-1/2

              rounded-full

              bg-violet-600/10

              blur-[120px]
            "
                    />


                    <div
                        className="
              relative

              mx-auto
              max-w-7xl

              px-5
              pb-24
              pt-20

              sm:px-6
              sm:pt-28

              lg:px-8
              lg:pb-32
              lg:pt-32
            "
                    >

                        <div
                            className="
                grid
                items-center
                gap-16

                lg:grid-cols-[1fr_0.95fr]
                lg:gap-20
              "
                        >

                            {/* ============================================
                  HERO COPY
              ============================================ */}

                            <div>

                                <div
                                    className="
                    inline-flex
                    items-center
                    gap-2

                    rounded-full

                    border
                    border-violet-500/20

                    bg-violet-500/10

                    px-4
                    py-2

                    text-sm
                    font-medium

                    text-violet-300
                  "
                                >

                                    <CircleDollarSign
                                        size={16}
                                    />

                                    Personal finance, made clearer

                                </div>


                                <h1
                                    className="
                    mt-7

                    max-w-3xl

                    text-4xl
                    font-bold
                    leading-[1.08]
                    tracking-tight

                    sm:text-5xl
                    lg:text-6xl
                    xl:text-7xl
                  "
                                >
                                    Know where your
                                    money goes.

                                    <span
                                        className="
                      block
                      text-violet-400
                    "
                                    >
                                        Plan where it goes next.
                                    </span>

                                </h1>


                                <p
                                    className="
                    mt-7

                    max-w-2xl

                    text-base
                    leading-8

                    text-zinc-400

                    sm:text-lg
                  "
                                >
                                    Finora brings transactions,
                                    budgets and financial insights
                                    together in one focused workspace
                                    so you can understand your money
                                    without managing spreadsheets.
                                </p>


                                {/* CTA */}

                                <div
                                    className="
                    mt-9

                    flex
                    flex-col
                    gap-3

                    sm:flex-row
                    sm:items-center
                  "
                                >

                                    <Link
                                        to="/register"
                                        className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2

                      rounded-xl

                      bg-violet-600

                      px-6
                      py-3.5

                      text-sm
                      font-semibold

                      shadow-lg
                      shadow-violet-950/40

                      transition-all

                      hover:bg-violet-500
                    "
                                    >
                                        Create your account

                                        <ArrowRight
                                            size={17}
                                        />
                                    </Link>


                                    <a
                                        href="#features"
                                        className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2

                      rounded-xl

                      border
                      border-zinc-800

                      bg-zinc-900/60

                      px-6
                      py-3.5

                      text-sm
                      font-semibold

                      text-zinc-200

                      transition-colors

                      hover:border-zinc-700
                      hover:bg-zinc-900
                    "
                                    >
                                        Explore features

                                        <ChevronRight
                                            size={16}
                                        />
                                    </a>

                                </div>


                                {/* PRODUCT POINTS */}

                                <div
                                    className="
                    mt-9

                    flex
                    flex-wrap
                    gap-x-6
                    gap-y-3
                  "
                                >

                                    {[
                                        "Free to get started",
                                        "Focused personal finance",
                                        "No spreadsheets required",
                                    ].map((item) => (

                                        <div
                                            key={item}
                                            className="
                        flex
                        items-center
                        gap-2

                        text-sm
                        text-zinc-500
                      "
                                        >

                                            <Check
                                                size={15}
                                                className="
                          text-emerald-400
                        "
                                            />

                                            {item}

                                        </div>

                                    ))}

                                </div>

                            </div>


                            {/* ============================================
                  PRODUCT PREVIEW
            ============================================ */}

                            <div
                                className="
                  relative

                  mx-auto
                  w-full
                  max-w-xl
                "
                            >

                                <div
                                    aria-hidden="true"
                                    className="
                    absolute
                    inset-10

                    bg-violet-500/10

                    blur-3xl
                  "
                                />


                                <div
                                    className="
                    relative

                    overflow-hidden

                    rounded-[28px]

                    border
                    border-zinc-800

                    bg-zinc-900/90

                    shadow-2xl
                    shadow-black/40
                  "
                                >

                                    {/* WINDOW BAR */}

                                    <div
                                        className="
                      flex
                      h-12
                      items-center

                      border-b
                      border-zinc-800

                      px-5
                    "
                                    >

                                        <div
                                            className="
                        flex
                        gap-2
                      "
                                        >

                                            <span
                                                className="
                          h-2.5
                          w-2.5
                          rounded-full
                          bg-zinc-700
                        "
                                            />

                                            <span
                                                className="
                          h-2.5
                          w-2.5
                          rounded-full
                          bg-zinc-700
                        "
                                            />

                                            <span
                                                className="
                          h-2.5
                          w-2.5
                          rounded-full
                          bg-zinc-700
                        "
                                            />

                                        </div>

                                        <span
                                            className="
                        ml-auto

                        text-xs
                        font-medium

                        text-zinc-600
                      "
                                        >
                                            Finora Dashboard
                                        </span>

                                    </div>


                                    {/* DASHBOARD */}

                                    <div
                                        className="
                      p-5
                      sm:p-7
                    "
                                    >

                                        <div
                                            className="
                        flex
                        items-start
                        justify-between
                        gap-5
                      "
                                        >

                                            <div>

                                                <p
                                                    className="
                            text-xs
                            font-medium
                            uppercase
                            tracking-wider

                            text-zinc-500
                          "
                                                >
                                                    Monthly overview
                                                </p>

                                                <h2
                                                    className="
                            mt-2

                            text-2xl
                            font-bold

                            sm:text-3xl
                          "
                                                >
                                                    ₹52,400
                                                </h2>

                                                <p
                                                    className="
                            mt-1

                            text-xs
                            text-zinc-500
                          "
                                                >
                                                    Current balance
                                                </p>

                                            </div>


                                            <div
                                                className="
                          flex
                          h-11
                          w-11
                          items-center
                          justify-center

                          rounded-xl

                          bg-emerald-500/10

                          text-emerald-400
                        "
                                            >
                                                <TrendingUp
                                                    size={20}
                                                />
                                            </div>

                                        </div>


                                        {/* SUMMARY */}

                                        <div
                                            className="
                        mt-7

                        grid
                        gap-3

                        sm:grid-cols-2
                      "
                                        >

                                            <div
                                                className="
                          rounded-2xl

                          border
                          border-zinc-800

                          bg-zinc-950/80

                          p-4
                        "
                                            >

                                                <div
                                                    className="
                            flex
                            items-center
                            gap-2

                            text-xs
                            text-zinc-500
                          "
                                                >
                                                    <TrendingUp
                                                        size={14}
                                                        className="
                              text-emerald-400
                            "
                                                    />

                                                    Income
                                                </div>

                                                <p
                                                    className="
                            mt-3

                            text-xl
                            font-semibold

                            text-emerald-400
                          "
                                                >
                                                    +₹75,000
                                                </p>

                                            </div>


                                            <div
                                                className="
                          rounded-2xl

                          border
                          border-zinc-800

                          bg-zinc-950/80

                          p-4
                        "
                                            >

                                                <div
                                                    className="
                            flex
                            items-center
                            gap-2

                            text-xs
                            text-zinc-500
                          "
                                                >
                                                    <TrendingDown
                                                        size={14}
                                                        className="
                              text-rose-400
                            "
                                                    />

                                                    Expenses
                                                </div>

                                                <p
                                                    className="
                            mt-3

                            text-xl
                            font-semibold

                            text-rose-400
                          "
                                                >
                                                    -₹22,600
                                                </p>

                                            </div>

                                        </div>


                                        {/* MINI CHART */}

                                        <div
                                            className="
                        mt-4

                        rounded-2xl

                        border
                        border-zinc-800

                        bg-zinc-950/80

                        p-5
                      "
                                        >

                                            <div
                                                className="
                          flex
                          items-center
                          justify-between
                        "
                                            >

                                                <div>

                                                    <p
                                                        className="
                              text-sm
                              font-medium
                            "
                                                    >
                                                        Spending trend
                                                    </p>

                                                    <p
                                                        className="
                              mt-1

                              text-xs
                              text-zinc-500
                            "
                                                    >
                                                        Last 6 months
                                                    </p>

                                                </div>

                                                <BarChart3
                                                    size={18}
                                                    className="
                            text-violet-400
                          "
                                                />

                                            </div>


                                            <div
                                                className="
                          mt-6

                          flex
                          h-28
                          items-end
                          gap-3
                        "
                                            >

                                                {[
                                                    38,
                                                    54,
                                                    42,
                                                    68,
                                                    57,
                                                    82,
                                                    62,
                                                    74,
                                                ].map((
                                                    height,
                                                    index
                                                ) => (

                                                    <div
                                                        key={index}
                                                        className="
                              flex
                              h-full
                              flex-1
                              items-end
                            "
                                                    >

                                                        <div
                                                            style={{
                                                                height:
                                                                    `${height}% `,
                                                            }}
                                                            className="
                                w-full

                                rounded-t-md

                                bg-violet-500/70
                              "
                                                        />

                                                    </div>

                                                ))}

                                            </div>

                                        </div>


                                        {/* BUDGET */}

                                        <div
                                            className="
                        mt-4

                        rounded-2xl

                        border
                        border-zinc-800

                        bg-zinc-950/80

                        p-5
                      "
                                        >

                                            <div
                                                className="
                          flex
                          items-center
                          justify-between
                        "
                                            >

                                                <div>

                                                    <p
                                                        className="
                              text-sm
                              font-medium
                            "
                                                    >
                                                        Monthly budget
                                                    </p>

                                                    <p
                                                        className="
                              mt-1

                              text-xs
                              text-zinc-500
                            "
                                                    >
                                                        ₹20,400 of ₹30,000
                                                    </p>

                                                </div>

                                                <span
                                                    className="
                            rounded-lg

                            bg-violet-500/10

                            px-2.5
                            py-1

                            text-xs
                            font-semibold

                            text-violet-300
                          "
                                                >
                                                    68%
                                                </span>

                                            </div>


                                            <div
                                                className="
                          mt-4

                          h-2

                          overflow-hidden
                          rounded-full

                          bg-zinc-800
                        "
                                            >

                                                <div
                                                    className="
                            h-full
                            w-[68%]

                            rounded-full

                            bg-violet-500
                          "
                                                />

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==================================================
            PRODUCT STRIP
        ================================================== */}
                <section
                    className="
            border-y
            border-zinc-900

            bg-zinc-950/50
          "
                >

                    <div
                        className="
              mx-auto
              max-w-7xl

              px-5
              py-7

              sm:px-6
              lg:px-8
            "
                    >

                        <div
                            className="
                grid
                gap-5

                sm:grid-cols-2
                lg:grid-cols-4
              "
                        >

                            {productPoints.map(
                                (item) => (

                                    <div
                                        key={item}
                                        className="
                      flex
                      items-center
                      justify-center
                      gap-2

                      text-sm
                      font-medium

                      text-zinc-400

                      lg:justify-start
                    "
                                    >

                                        <Check
                                            size={16}
                                            className="
                        shrink-0
                        text-violet-400
                      "
                                        />

                                        {item}

                                    </div>

                                )
                            )}

                        </div>

                    </div>

                </section>


                {/* ==================================================
            FEATURES
        ================================================== */}
                <section
                    id="features"
                    className="
            scroll-mt-24

            mx-auto
            max-w-7xl

            px-5
            py-24

            sm:px-6
            lg:px-8
            lg:py-32
          "
                >

                    <div
                        className="
              max-w-2xl
            "
                    >

                        <p
                            className="
                text-sm
                font-semibold
                uppercase
                tracking-[0.18em]

                text-violet-400
              "
                        >
                            Core features
                        </p>


                        <h2
                            className="
                mt-4

                text-3xl
                font-bold
                tracking-tight

                sm:text-4xl
                lg:text-5xl
              "
                        >
                            One workspace for your
                            everyday finances.
                        </h2>


                        <p
                            className="
                mt-5

                text-base
                leading-7

                text-zinc-400

                sm:text-lg
              "
                        >
                            Finora focuses on the tools
                            that matter most for understanding
                            personal cash flow without adding
                            unnecessary complexity.
                        </p>

                    </div>


                    <div
                        className="
              mt-14

              grid
              gap-5

              md:grid-cols-2
              lg:grid-cols-3
            "
                    >

                        {features.map(
                            (feature) => {

                                const Icon =
                                    feature.icon;

                                return (

                                    <article
                                        key={feature.title}
                                        className="
                      group

                      rounded-3xl

                      border
                      border-zinc-800

                      bg-zinc-900/40

                      p-7

                      transition-all
                      duration-200

                      hover:border-zinc-700
                      hover:bg-zinc-900/70
                    "
                                    >

                                        <div
                                            className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center

                        rounded-xl

                        border
                        border-violet-500/10

                        bg-violet-500/10

                        text-violet-400
                      "
                                        >

                                            <Icon
                                                size={21}
                                            />

                                        </div>


                                        <h3
                                            className="
                        mt-6

                        text-lg
                        font-semibold
                      "
                                        >
                                            {feature.title}
                                        </h3>


                                        <p
                                            className="
                        mt-3

                        text-sm
                        leading-7

                        text-zinc-400
                      "
                                        >
                                            {feature.description}
                                        </p>

                                    </article>

                                );

                            }
                        )}

                    </div>

                </section>


                {/* ==================================================
            ANALYTICS SHOWCASE
        ================================================== */}
                <section
                    id="analytics"
                    className="
            scroll-mt-24

            border-y
            border-zinc-900

            bg-zinc-900/20
          "
                >

                    <div
                        className="
              mx-auto

              grid
              max-w-7xl
              items-center
              gap-16

              px-5
              py-24

              sm:px-6

              lg:grid-cols-2
              lg:px-8
              lg:py-32
            "
                    >

                        {/* VISUAL */}

                        <div
                            className="
                rounded-3xl

                border
                border-zinc-800

                bg-zinc-900/70

                p-6

                shadow-2xl
                shadow-black/20
              "
                        >

                            <div
                                className="
                  flex
                  items-center
                  justify-between
                "
                            >

                                <div>

                                    <p
                                        className="
                      text-sm
                      font-semibold
                    "
                                    >
                                        Expense breakdown
                                    </p>

                                    <p
                                        className="
                      mt-1

                      text-xs
                      text-zinc-500
                    "
                                    >
                                        Monthly category analysis
                                    </p>

                                </div>

                                <PieChart
                                    size={21}
                                    className="
                    text-violet-400
                  "
                                />

                            </div>


                            <div
                                className="
                  mt-8

                  flex
                  justify-center
                "
                            >

                                {/* CSS DONUT PREVIEW */}

                                <div
                                    className="
                    relative

                    flex
                    h-48
                    w-48

                    items-center
                    justify-center

                    rounded-full

                    bg-[conic-gradient(#8b5cf6_0deg_125deg,#22c55e_125deg_210deg,#f59e0b_210deg_275deg,#3f3f46_275deg_360deg)]
                  "
                                >

                                    <div
                                        className="
                      flex
                      h-32
                      w-32

                      flex-col
                      items-center
                      justify-center

                      rounded-full

                      bg-zinc-900
                    "
                                    >

                                        <span
                                            className="
                        text-xs
                        text-zinc-500
                      "
                                        >
                                            Expenses
                                        </span>

                                        <span
                                            className="
                        mt-1

                        text-xl
                        font-bold
                      "
                                        >
                                            ₹22,600
                                        </span>

                                    </div>

                                </div>

                            </div>


                            <div
                                className="
                  mt-8

                  grid
                  gap-3

                  sm:grid-cols-3
                "
                            >

                                {[
                                    {
                                        name: "Housing",
                                        value: "35%",
                                    },
                                    {
                                        name: "Food",
                                        value: "24%",
                                    },
                                    {
                                        name: "Other",
                                        value: "41%",
                                    },
                                ].map((item) => (

                                    <div
                                        key={item.name}
                                        className="
                      rounded-xl

                      bg-zinc-950

                      px-4
                      py-3
                    "
                                    >

                                        <p
                                            className="
                        text-xs
                        text-zinc-500
                      "
                                        >
                                            {item.name}
                                        </p>

                                        <p
                                            className="
                        mt-1
                        font-semibold
                      "
                                        >
                                            {item.value}
                                        </p>

                                    </div>

                                ))}

                            </div>

                        </div>


                        {/* COPY */}

                        <div>

                            <p
                                className="
                  text-sm
                  font-semibold
                  uppercase
                  tracking-[0.18em]

                  text-violet-400
                "
                            >
                                Financial insights
                            </p>


                            <h2
                                className="
                  mt-4

                  text-3xl
                  font-bold
                  tracking-tight

                  sm:text-4xl
                  lg:text-5xl
                "
                            >
                                Turn transaction history
                                into useful context.
                            </h2>


                            <p
                                className="
                  mt-6

                  text-base
                  leading-8

                  text-zinc-400
                "
                            >
                                Reports help you move beyond
                                individual transactions and see
                                how income, expenses, categories
                                and budgets behave over time.
                            </p>


                            <div
                                className="
                  mt-8
                  space-y-4
                "
                            >

                                {reportFeatures.map(
                                    (item) => (

                                        <div
                                            key={item}
                                            className="
                        flex
                        items-center
                        gap-3
                      "
                                        >

                                            <div
                                                className="
                          flex
                          h-7
                          w-7
                          shrink-0
                          items-center
                          justify-center

                          rounded-lg

                          bg-emerald-500/10

                          text-emerald-400
                        "
                                            >
                                                <Check
                                                    size={15}
                                                />
                                            </div>

                                            <span
                                                className="
                          text-sm
                          font-medium

                          text-zinc-300
                        "
                                            >
                                                {item}
                                            </span>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==================================================
            HOW IT WORKS / MVP
        ================================================== */}
                <section
                    id="product"
                    className="
            scroll-mt-24

            mx-auto
            max-w-7xl

            px-5
            py-24

            sm:px-6

            lg:px-8
            lg:py-32
          "
                >

                    <div
                        className="
              text-center
            "
                    >

                        <p
                            className="
                text-sm
                font-semibold
                uppercase
                tracking-[0.18em]

                text-violet-400
              "
                        >
                            How Finora works
                        </p>


                        <h2
                            className="
                mx-auto
                mt-4

                max-w-3xl

                text-3xl
                font-bold
                tracking-tight

                sm:text-4xl
                lg:text-5xl
              "
                        >
                            A simple workflow from
                            recording to understanding.
                        </h2>

                    </div>


                    <div
                        className="
              mt-16

              grid
              gap-5

              md:grid-cols-3
            "
                    >

                        {[
                            {
                                number: "01",
                                title: "Record",
                                description:
                                    "Add your income and expenses with dates, descriptions and categories.",
                            },
                            {
                                number: "02",
                                title: "Plan",
                                description:
                                    "Create monthly category budgets and keep track of how your spending compares.",
                            },
                            {
                                number: "03",
                                title: "Understand",
                                description:
                                    "Use your dashboard and reports to identify trends and understand your financial activity.",
                            },
                        ].map((step) => (

                            <article
                                key={step.number}
                                className="
                  relative

                  rounded-3xl

                  border
                  border-zinc-800

                  bg-zinc-900/40

                  p-8
                "
                            >

                                <span
                                    className="
                    text-sm
                    font-bold

                    text-violet-400
                  "
                                >
                                    {step.number}
                                </span>


                                <h3
                                    className="
                    mt-8

                    text-2xl
                    font-semibold
                  "
                                >
                                    {step.title}
                                </h3>


                                <p
                                    className="
                    mt-4

                    text-sm
                    leading-7

                    text-zinc-400
                  "
                                >
                                    {step.description}
                                </p>

                            </article>

                        ))}

                    </div>

                </section>


                {/* ==================================================
            SECURITY / ACCOUNT
        ================================================== */}
                <section
                    className="
            mx-auto
            max-w-7xl

            px-5
            pb-24

            sm:px-6

            lg:px-8
            lg:pb-32
          "
                >

                    <div
                        className="
              grid
              gap-10

              rounded-[32px]

              border
              border-zinc-800

              bg-zinc-900/50

              p-8

              sm:p-10

              lg:grid-cols-[auto_1fr_auto]
              lg:items-center
              lg:p-12
            "
                    >

                        <div
                            className="
                flex
                h-14
                w-14
                items-center
                justify-center

                rounded-2xl

                bg-violet-500/10

                text-violet-400
              "
                        >
                            <LockKeyhole
                                size={26}
                            />
                        </div>


                        <div>

                            <h2
                                className="
                  text-2xl
                  font-bold

                  sm:text-3xl
                "
                            >
                                Your finances belong
                                to your account.
                            </h2>

                            <p
                                className="
                  mt-3

                  max-w-2xl

                  text-sm
                  leading-7

                  text-zinc-400
                "
                            >
                                Finora uses authenticated
                                user accounts so your personal
                                transactions, categories, budgets
                                and reports remain associated
                                with your own workspace.
                            </p>

                        </div>


                        <ShieldCheck
                            size={42}
                            className="
                hidden

                text-emerald-400

                lg:block
              "
                        />

                    </div>

                </section>


                {/* ==================================================
            FINAL CTA
        ================================================== */}
                <section
                    className="
            px-5
            pb-24

            sm:px-6
        
            lg:px-8
            lg:pb-32
          "
                >

                    <div
                        className="
              relative

              mx-auto
              max-w-5xl

              overflow-hidden

              rounded-[36px]

              border
              border-violet-500/20

              bg-violet-950/30

              px-6
              py-16

              text-center

              sm:px-12
              sm:py-20
            "
                    >

                        <div
                            aria-hidden="true"
                            className="
                pointer-events-none

                absolute
                left-1/2
                top-[-200px]

                h-96
                w-96

                -translate-x-1/2

                rounded-full

                bg-violet-500/20

                blur-3xl
              "
                        />


                        <div
                            className="
                relative
                z-10
              "
                        >

                            <Logo
                                variant="mark"
                                size="lg"
                                className="mx-auto"
                            />


                            <h2
                                className="
                  mx-auto
                  mt-7

                  max-w-3xl

                  text-3xl
                  font-bold
                  tracking-tight

                  sm:text-4xl
                  lg:text-5xl
                "
                            >
                                Start building a clearer
                                picture of your finances.
                            </h2>


                            <p
                                className="
                  mx-auto
                  mt-5

                  max-w-xl

                  text-base
                  leading-7

                  text-zinc-400
                "
                            >
                                Bring your transactions,
                                budgets and financial insights
                                together with Finora.
                            </p>


                            <Link
                                to="/register"
                                className="
                  mt-8

                  inline-flex
                  items-center
                  gap-2

                  rounded-xl

                  px-6
                  py-3.5

                  text-sm
                  font-semibold

                  text-zinc-950

                  transition-all

                  hover:bg-zinc-600
                "
                            >
                                Create your account

                                <ArrowRight
                                    size={17}
                                />
                            </Link>

                        </div>

                    </div>

                </section>

            </main>


            {/* ==================================================
          FOOTER
      ================================================== */}
            <footer
                className="
          border-t
          border-zinc-900
        "
            >

                <div
                    className="
            mx-auto
            max-w-7xl

            px-5
            py-10

            sm:px-6
            lg:px-8
          "
                >

                    <div
                        className="
              flex
              flex-col
              gap-8

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
                    >

                        <Logo
                            variant="full"
                            size="sm"
                        />


                        <div
                            className="
                flex
                flex-wrap
                gap-x-6
                gap-y-3
              "
                        >

                            <a
                                href="#features"
                                className="
                  text-sm
                  text-zinc-500

                  transition-colors

                  hover:text-zinc-300
                "
                            >
                                Features
                            </a>

                            <a
                                href="#analytics"
                                className="
                  text-sm
                  text-zinc-500

                  transition-colors

                  hover:text-zinc-300
                "
                            >
                                Analytics
                            </a>

                            <Link
                                to="/login"
                                className="
                  text-sm
                  text-zinc-500

                  transition-colors

                  hover:text-zinc-300
                "
                            >
                                Sign in
                            </Link>

                        </div>

                    </div>


                    <div
                        className="
              mt-8

              flex
              flex-col
              gap-2

              border-t
              border-zinc-900

              pt-8

              text-xs
              text-zinc-600

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
                    >

                        <p>
                            © 2026 Finora. Personal Finance.
                        </p>

                        <p>
                            Track. Plan. Understand.
                        </p>

                    </div>

                </div>

            </footer>

        </div>

    );

}

