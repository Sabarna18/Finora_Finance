// ======================================================
// src/pages/AboutPage.tsx
// ======================================================

import {
    Link,
} from "react-router-dom";



import {
    ArrowLeft,
    ArrowRight,
    Boxes,
    Check,
    Code2,
    Database,
    Layers3,
    Mail,
    Server,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    UserRound,
} from "lucide-react";

import Logo
    from "../components/brands/Logo";

import {
    useAuthStore,
} from "../store/auth.store";


// ======================================================
// PRODUCT CAPABILITIES
// ======================================================

const capabilities = [
    "Income and expense tracking",
    "Transaction categorization",
    "Monthly budget management",
    "Dashboard financial summaries",
    "Cash-flow reporting",
    "Income vs expense analysis",
    "Category spending insights",
    "Budget performance analysis",
    "Account and profile management",
    "Responsive application experience",
];


// ======================================================
// BUILDING PRINCIPLES
// ======================================================

const principles = [
    {
        icon: Target,
        title: "Solve the core problem first",
        description:
            "Finora focuses on the everyday personal-finance workflow: record transactions, organize spending, plan budgets and understand financial activity.",
    },
    {
        icon: Layers3,
        title: "Build modularly",
        description:
            "Features are separated into reusable frontend components, API layers, hooks, backend services and database models so the system can evolve without becoming tightly coupled.",
    },
    {
        icon: ShieldCheck,
        title: "Design for real users",
        description:
            "Authentication, validation, loading states, responsive layouts and account-level data separation are treated as core product requirements rather than optional polish.",
    },
    {
        icon: Sparkles,
        title: "Keep the experience focused",
        description:
            "The interface prioritizes financial information and clear actions instead of adding features simply to make the application appear more complex.",
    },
];


// ======================================================
// DEVELOPMENT JOURNEY
// ======================================================

const journey = [
    {
        number: "01",
        title: "Foundation",
        description:
            "Defined the financial domain, application architecture, database relationships and authenticated user model.",
    },
    {
        number: "02",
        title: "Core finance engine",
        description:
            "Built transactions, categories and budgets as the foundational workflows behind the product.",
    },
    {
        number: "03",
        title: "Insights",
        description:
            "Added dashboard summaries and reporting services to turn stored financial records into useful information.",
    },
    {
        number: "04",
        title: "Product experience",
        description:
            "Built the React interface around reusable feature modules, query-driven server state and responsive application layouts.",
    },
    {
        number: "05",
        title: "v1 refinement",
        description:
            "Introduced the Finora identity and focused on consistent interaction states, feedback, accessibility, responsive behavior and visual polish.",
    },
];


// ======================================================
// TECH STACK
// ======================================================

const technologies = [
    {
        icon: Code2,
        label: "Frontend",
        value: "React · TypeScript · Vite",
    },
    {
        icon: Server,
        label: "Backend",
        value: "FastAPI · Python",
    },
    {
        icon: Database,
        label: "Data",
        value: "SQLAlchemy · Relational Database",
    },
    {
        icon: Boxes,
        label: "Client Architecture",
        value: "TanStack Query · Zustand · Axios",
    },
];


// ======================================================
// PAGE
// ======================================================

export default function AboutPage() {

    const isAuthenticated =
        useAuthStore(
            (state) =>
                state.isAuthenticated
        );


    return (

        <div
            className="
        min-h-screen

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

          bg-zinc-950/85

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
                        to={
                            isAuthenticated
                                ? "/dashboard"
                                : "/"
                        }
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


                    {/* NAVIGATION */}

                    <div
                        className="
              flex
              items-center
              gap-2

              sm:gap-3
            "
                    >

                        {isAuthenticated ? (

                            <Link
                                to="/dashboard"
                                className="
                  inline-flex
                  items-center
                  gap-2

                  rounded-xl

                  border
                  border-zinc-800

                  px-4
                  py-2.5

                  text-sm
                  font-semibold

                  text-zinc-300

                  transition-colors

                  hover:border-zinc-700
                  hover:bg-zinc-900
                  hover:text-white
                "
                            >

                                <ArrowLeft
                                    size={16}
                                />

                                <span
                                    className="
                    hidden
                    sm:inline
                  "
                                >
                                    Dashboard
                                </span>

                            </Link>

                        ) : (

                            <>
                                <Link
                                    to="/login"
                                    className="
                    hidden

                    rounded-xl

                    px-4
                    py-2.5

                    text-sm
                    font-semibold

                    text-zinc-300

                    transition-colors

                    hover:text-white

                    sm:inline-flex
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

                    transition-colors

                    hover:bg-violet-500

                    sm:px-5
                  "
                                >
                                    Get started
                                </Link>
                            </>

                        )}

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

                    <div
                        aria-hidden="true"
                        className="
              pointer-events-none

              absolute
              left-1/2
              top-[-350px]

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
              max-w-5xl

              px-5
              pb-24
              pt-24

              text-center

              sm:px-6
              sm:pb-28
              sm:pt-32

              lg:px-8
            "
                    >

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

                            <Sparkles
                                size={15}
                            />

                            About Finora

                        </div>


                        <h1
                            className="
                mx-auto
                mt-7

                max-w-4xl

                text-4xl
                font-bold
                leading-tight
                tracking-tight

                sm:text-5xl
                lg:text-6xl
              "
                        >
                            Personal finance software
                            built around

                            <span
                                className="
                  text-violet-400
                "
                            >
                                {" "}clarity.
                            </span>
                        </h1>


                        <p
                            className="
                mx-auto
                mt-7

                max-w-3xl

                text-base
                leading-8

                text-zinc-400

                sm:text-lg
              "
                        >
                            Finora is a full-stack personal
                            finance application designed to
                            bring transaction tracking,
                            budgeting and financial analysis
                            into one focused workspace.
                        </p>


                        <div
                            className="
                mt-10

                flex
                flex-wrap
                justify-center
                gap-3
              "
                        >

                            {isAuthenticated ? (

                                <Link
                                    to="/dashboard"
                                    className="
                    inline-flex
                    items-center
                    gap-2

                    rounded-xl

                    bg-violet-600

                    px-6
                    py-3.5

                    text-sm
                    font-semibold

                    transition-colors

                    hover:bg-violet-500
                  "
                                >
                                    Open dashboard

                                    <ArrowRight
                                        size={17}
                                    />
                                </Link>

                            ) : (

                                <Link
                                    to="/register"
                                    className="
                    inline-flex
                    items-center
                    gap-2

                    rounded-xl

                    bg-violet-600

                    px-6
                    py-3.5

                    text-sm
                    font-semibold

                    transition-colors

                    hover:bg-violet-500
                  "
                                >
                                    Explore Finora

                                    <ArrowRight
                                        size={17}
                                    />
                                </Link>

                            )}

                        </div>

                    </div>

                </section>


                {/* ==================================================
            PRODUCT STORY
        ================================================== */}
                <section
                    className="
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
              gap-14

              px-5
              py-24

              sm:px-6

              lg:grid-cols-2
              lg:items-center
              lg:px-8
              lg:py-28
            "
                    >

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
                                The product
                            </p>


                            <h2
                                className="
                  mt-4

                  text-3xl
                  font-bold
                  tracking-tight

                  sm:text-4xl
                "
                            >
                                Built to answer a simple
                                financial question.
                            </h2>


                            <p
                                className="
                  mt-6

                  text-lg
                  leading-8

                  text-zinc-300
                "
                            >
                                Where is my money actually going?
                            </p>


                            <p
                                className="
                  mt-5

                  max-w-xl

                  text-sm
                  leading-7

                  text-zinc-400
                "
                            >
                                Financial information is often
                                scattered between transaction
                                histories, notes and spreadsheets.
                                Finora brings the essential pieces
                                together so users can record what
                                happened, plan what comes next and
                                understand the bigger picture.
                            </p>

                        </div>


                        {/* PRODUCT PRINCIPLE CARD */}

                        <div
                            className="
                rounded-[32px]

                border
                border-zinc-800

                bg-zinc-900/70

                p-7

                sm:p-9
              "
                        >

                            <div
                                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center

                  rounded-2xl

                  bg-violet-500/10

                  text-violet-400
                "
                            >
                                <TrendingUp
                                    size={23}
                                />
                            </div>


                            <p
                                className="
                  mt-7

                  text-2xl
                  font-semibold
                  leading-9
                "
                            >
                                Record.
                                <br />
                                Plan.
                                <br />
                                Understand.
                            </p>


                            <p
                                className="
                  mt-5

                  text-sm
                  leading-7

                  text-zinc-400
                "
                            >
                                Those three actions form the
                                product philosophy behind
                                Finora's first major release.
                            </p>

                        </div>

                    </div>

                </section>


                {/* ==================================================
            V1 CAPABILITIES
        ================================================== */}
                <section
                    className="
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
              grid
              gap-14

              lg:grid-cols-[0.8fr_1.2fr]
            "
                    >

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
                                Finora v1
                            </p>


                            <h2
                                className="
                  mt-4

                  text-3xl
                  font-bold
                  tracking-tight

                  sm:text-4xl
                "
                            >
                                The first complete
                                product foundation.
                            </h2>


                            <p
                                className="
                  mt-5

                  text-sm
                  leading-7

                  text-zinc-400
                "
                            >
                                Version 1 focuses deliberately
                                on the core personal-finance
                                workflow rather than trying to
                                cover every possible financial
                                use case.
                            </p>

                        </div>


                        <div
                            className="
                grid
                gap-3

                sm:grid-cols-2
              "
                        >

                            {capabilities.map(
                                (capability) => (

                                    <div
                                        key={capability}
                                        className="
                      flex
                      items-center
                      gap-3

                      rounded-2xl

                      border
                      border-zinc-800

                      bg-zinc-900/40

                      px-5
                      py-4
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
                                                size={14}
                                            />
                                        </div>


                                        <span
                                            className="
                        text-sm
                        font-medium

                        text-zinc-300
                      "
                                        >
                                            {capability}
                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    </div>

                </section>


                {/* ==================================================
            DEVELOPMENT JOURNEY
        ================================================== */}
                <section
                    className="
            border-y
            border-zinc-900

            bg-zinc-900/20
          "
                >

                    <div
                        className="
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
                max-w-3xl
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
                                Building Finora
                            </p>


                            <h2
                                className="
                  mt-4

                  text-3xl
                  font-bold
                  tracking-tight

                  sm:text-4xl
                "
                            >
                                From data model to
                                complete product.
                            </h2>


                            <p
                                className="
                  mt-5

                  text-sm
                  leading-7

                  text-zinc-400
                "
                            >
                                Finora was developed
                                incrementally, beginning with
                                domain architecture and moving
                                through finance workflows,
                                analytics and finally the
                                complete user experience.
                            </p>

                        </div>


                        <div
                            className="
                mt-14

                grid
                gap-4

                md:grid-cols-2
                lg:grid-cols-5
              "
                        >

                            {journey.map(
                                (stage) => (

                                    <article
                                        key={stage.number}
                                        className="
                      rounded-3xl

                      border
                      border-zinc-800

                      bg-zinc-950

                      p-6
                    "
                                    >

                                        <span
                                            className="
                        text-sm
                        font-bold

                        text-violet-400
                      "
                                        >
                                            {stage.number}
                                        </span>


                                        <h3
                                            className="
                        mt-7

                        text-lg
                        font-semibold
                      "
                                        >
                                            {stage.title}
                                        </h3>


                                        <p
                                            className="
                        mt-3

                        text-sm
                        leading-6

                        text-zinc-500
                      "
                                        >
                                            {stage.description}
                                        </p>

                                    </article>

                                )
                            )}

                        </div>

                    </div>

                </section>


                {/* ==================================================
            ENGINEERING PRINCIPLES
        ================================================== */}
                <section
                    className="
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
                            Product principles
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
              "
                        >
                            Designed like a product,
                            engineered like a system.
                        </h2>

                    </div>


                    <div
                        className="
              mt-14

              grid
              gap-5

              md:grid-cols-2
            "
                    >

                        {principles.map(
                            (principle) => {

                                const Icon =
                                    principle.icon;

                                return (

                                    <article
                                        key={principle.title}
                                        className="
                      rounded-3xl

                      border
                      border-zinc-800

                      bg-zinc-900/40

                      p-7
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
                                            {principle.title}
                                        </h3>


                                        <p
                                            className="
                        mt-3

                        text-sm
                        leading-7

                        text-zinc-400
                      "
                                        >
                                            {principle.description}
                                        </p>

                                    </article>

                                );

                            }
                        )}

                    </div>

                </section>


                {/* ==================================================
            TECHNOLOGY
        ================================================== */}
                <section
                    className="
            border-y
            border-zinc-900

            bg-zinc-900/20
          "
                >

                    <div
                        className="
              mx-auto
              max-w-7xl

              px-5
              py-24

              sm:px-6

              lg:px-8
              lg:py-28
            "
                    >

                        <div
                            className="
                grid
                gap-12

                lg:grid-cols-[0.7fr_1.3fr]
                lg:items-start
              "
                        >

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
                                    Technology
                                </p>


                                <h2
                                    className="
                    mt-4

                    text-3xl
                    font-bold
                    tracking-tight

                    sm:text-4xl
                  "
                                >
                                    Modern full-stack
                                    architecture.
                                </h2>


                                <p
                                    className="
                    mt-5

                    text-sm
                    leading-7

                    text-zinc-400
                  "
                                >
                                    The application separates
                                    presentation, server state,
                                    API communication, business
                                    logic and persistence into
                                    distinct layers.
                                </p>

                            </div>


                            <div
                                className="
                  grid
                  gap-4

                  sm:grid-cols-2
                "
                            >

                                {technologies.map(
                                    (technology) => {

                                        const Icon =
                                            technology.icon;

                                        return (

                                            <div
                                                key={
                                                    technology.label
                                                }
                                                className="
                          flex
                          gap-4

                          rounded-2xl

                          border
                          border-zinc-800

                          bg-zinc-950

                          p-5
                        "
                                            >

                                                <div
                                                    className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center

                            rounded-xl

                            bg-zinc-900

                            text-violet-400
                          "
                                                >
                                                    <Icon
                                                        size={19}
                                                    />
                                                </div>


                                                <div>

                                                    <p
                                                        className="
                              text-xs
                              font-medium

                              text-zinc-500
                            "
                                                    >
                                                        {
                                                            technology.label
                                                        }
                                                    </p>

                                                    <p
                                                        className="
                              mt-1

                              text-sm
                              font-semibold

                              text-zinc-200
                            "
                                                    >
                                                        {
                                                            technology.value
                                                        }
                                                    </p>

                                                </div>

                                            </div>

                                        );

                                    }
                                )}

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==================================================
            CREATOR
        ================================================== */}
                <section
                    className="
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
              overflow-hidden

              rounded-[32px]

              border
              border-zinc-800

              bg-zinc-900/50
            "
                    >

                        <div
                            className="
                grid

                lg:grid-cols-[0.7fr_1.3fr]
              "
                        >

                            {/* CREATOR IDENTITY */}

                            <div
                                className="
                  flex
                  flex-col
                  justify-between

                  border-b
                  border-zinc-800

                  p-8

                  sm:p-10

                  lg:border-b-0
                  lg:border-r
                "
                            >

                                <div>

                                    <div
                                        className="
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center

                      rounded-2xl

                      bg-violet-600

                      text-xl
                      font-bold
                    "
                                    >
                                        SG
                                    </div>


                                    <p
                                        className="
                      mt-7

                      text-xs
                      font-semibold
                      uppercase
                      tracking-[0.18em]

                      text-violet-400
                    "
                                    >
                                        Creator
                                    </p>


                                    <h2
                                        className="
                      mt-3

                      text-2xl
                      font-bold
                    "
                                    >
                                        Sabarna Guha
                                    </h2>


                                    <p
                                        className="
                      mt-2

                      text-sm
                      text-zinc-500
                    "
                                    >
                                        Software Developer
                                    </p>

                                </div>


                                <div
                                    className="
                    mt-10

                    flex
                    gap-2
                  "
                                >

                                    {/*
                    Add your real URLs before
                    enabling these buttons.

                    Example:

                    <a
                      href="YOUR_GITHUB_URL"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Github />
                    </a>
                  */}

                                    <div
                                        className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center

                      rounded-xl

                      border
                      border-zinc-800

                      text-zinc-500
                    "
                                        title="GitHub"
                                    >
                                        <Code2
                                            size={18}
                                        />
                                    </div>


                                    <div
                                        className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center

                      rounded-xl

                      border
                      border-zinc-800

                      text-zinc-500
                    "
                                        title="Contact"
                                    >
                                        <Mail
                                            size={18}
                                        />
                                    </div>

                                </div>

                            </div>


                            {/* CREATOR STORY */}

                            <div
                                className="
                  p-8

                  sm:p-10
                  lg:p-12
                "
                            >

                                <UserRound
                                    size={24}
                                    className="
                    text-violet-400
                  "
                                />


                                <h3
                                    className="
                    mt-6

                    text-2xl
                    font-semibold
                  "
                                >
                                    Why I built Finora
                                </h3>


                                <div
                                    className="
                    mt-5
                    space-y-4

                    text-sm
                    leading-7

                    text-zinc-400
                  "
                                >

                                    <p>
                                        Finora began as an
                                        opportunity to build a
                                        complete application around
                                        a practical problem rather
                                        than an isolated technical
                                        demonstration.
                                    </p>


                                    <p>
                                        The project was designed
                                        across the full development
                                        lifecycle: data modelling,
                                        API architecture, business
                                        logic, authentication,
                                        frontend state management,
                                        analytics, responsive UI and
                                        production-focused refinement.
                                    </p>


                                    <p>
                                        The goal was not simply to
                                        create another CRUD project,
                                        but to understand how
                                        individual engineering
                                        decisions come together to
                                        form a coherent product.
                                    </p>

                                </div>


                                <div
                                    className="
                    mt-8

                    rounded-2xl

                    border
                    border-violet-500/10

                    bg-violet-500/5

                    p-5
                  "
                                >

                                    <p
                                        className="
                      text-sm
                      font-medium
                      leading-7

                      text-zinc-300
                    "
                                    >
                                        “Build the smallest complete
                                        product first, then improve
                                        it deliberately.”
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==================================================
            PRODUCT STATUS
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
              mx-auto
              max-w-5xl

              rounded-[32px]

              border
              border-violet-500/20

              bg-violet-950/20

              px-6
              py-14

              text-center

              sm:px-12
              sm:py-16
            "
                    >

                        <Logo
                            variant="mark"
                            size="lg"
                            className="mx-auto"
                        />


                        <p
                            className="
                mt-7

                text-sm
                font-semibold
                uppercase
                tracking-[0.18em]

                text-violet-400
              "
                        >
                            Finora v1.0
                        </p>


                        <h2
                            className="
                mx-auto
                mt-4

                max-w-2xl

                text-3xl
                font-bold
                tracking-tight

                sm:text-4xl
              "
                        >
                            The foundation is only
                            the beginning.
                        </h2>


                        <p
                            className="
                mx-auto
                mt-5

                max-w-2xl

                text-sm
                leading-7

                text-zinc-400
              "
                        >
                            Version 1 establishes the core
                            personal-finance experience and
                            the architecture required for
                            Finora to continue evolving.
                        </p>


                        <Link
                            to={
                                isAuthenticated
                                    ? "/dashboard"
                                    : "/register"
                            }
                            className="
                mt-8

                inline-flex
                items-center
                gap-2

                rounded-xl

                bg-violet-500

                px-6
                py-3.5

                text-sm
                font-semibold

                text-zinc-950

                transition-colors

                hover:bg-zinc-600
              "
                        >

                            {isAuthenticated
                                ? "Return to dashboard"
                                : "Get started with Finora"}

                            <ArrowRight
                                size={17}
                            />

                        </Link>

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
              gap-7

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
                gap-5

                text-sm
              "
                        >

                            <Link
                                to="/"
                                className="
                  text-zinc-500

                  transition-colors

                  hover:text-zinc-300
                "
                            >
                                Home
                            </Link>


                            {isAuthenticated ? (

                                <Link
                                    to="/dashboard"
                                    className="
                    text-zinc-500

                    transition-colors

                    hover:text-zinc-300
                  "
                                >
                                    Dashboard
                                </Link>

                            ) : (

                                <Link
                                    to="/login"
                                    className="
                    text-zinc-500

                    transition-colors

                    hover:text-zinc-300
                  "
                                >
                                    Sign in
                                </Link>

                            )}

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
                            © 2026 Finora.
                        </p>

                        <p>
                            Designed & built by Sabarna Guha.
                        </p>

                    </div>

                </div>

            </footer>

        </div>

    );

}

