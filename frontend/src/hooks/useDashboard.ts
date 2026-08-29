// // ======================================================
// // src/hooks/useDashboard.ts
// // ======================================================

// import { useQuery } from "@tanstack/react-query";
// import { getBudgetStatus } from "../api/budgets.api";


// export function useBudgetStatuses(
//     month: number,
//     year: number
// ) {

//     return useQuery({

//         queryKey: [
//             "dashboard",
//             "budget-status",
//             month,
//             year,
//         ],

//         queryFn: () =>
//             getBudgetStatuses(
//                 month,
//                 year
//             ),

//         enabled:
//             !!month &&
//             !!year,

//     });

// }