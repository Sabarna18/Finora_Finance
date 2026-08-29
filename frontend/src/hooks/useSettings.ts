import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    getProfile,
    updateProfile,
    changePassword,
    deactivateAccount,
} from "../api/settings.api";

import {appToast} from "../lib/toast";

// ==============================================
// PROFILE
// ==============================================
export function useProfile() {

    return useQuery({
        queryKey: ["profile"],
        queryFn: getProfile,
    });

}


// ==============================================
// UPDATE PROFILE
// ==============================================
export function useUpdateProfile() {

    const queryClient =
        useQueryClient();

    return useMutation({

        mutationFn: updateProfile,

        onSuccess: () => {

            appToast.success(
                "Profile updated successfully!",
                {description: "Your profile has been updated."}
            );

            queryClient.invalidateQueries({
                queryKey: ["profile"],
            });

        },

    });

}


// ==============================================
// CHANGE PASSWORD
// ==============================================
export function useChangePassword() {

    return useMutation({
        mutationFn: changePassword,

        onSuccess: () => {

            appToast.success(
                "Password changed successfully!",
                {description: "Your password has been changed."}
            );

        },
    });

}


// ==============================================
// DEACTIVATE ACCOUNT
// ==============================================
export function useDeactivateAccount() {

    return useMutation({
        mutationFn: deactivateAccount,

        onSuccess: () => {

            appToast.success(
                "Account deactivated successfully!",
                {description: "Your account has been deactivated."}
            );

        },  
    });

}