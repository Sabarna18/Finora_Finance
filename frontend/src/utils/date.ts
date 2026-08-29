// src/utils/date.ts

export function formatISTDateTime(
    dateString: string
) {

    return new Date(dateString)
        .toLocaleString(
            "en-IN",
            {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }
        );

}