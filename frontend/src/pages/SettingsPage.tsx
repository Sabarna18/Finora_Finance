// ======================================================
// src/pages/SettingsPage.tsx
// ======================================================

import {
  useNavigate,
} from "react-router-dom";

import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useDeactivateAccount,
} from "../hooks/useSettings";

import ProfileCard from "../components/cards/ProfileCard";

import PasswordCard from "../components/cards/PasswordCard";

import DangerZoneCard from "../components/cards/DangerZoneCard";

import {
  useAuthStore,
} from "../store/auth.store";


export default function SettingsPage() {

  const navigate =
    useNavigate();

  const logout =
    useAuthStore(
      (state) => state.logout
    );

  const {
    data: profile,
    isLoading,
  } = useProfile();

  const updateProfile =
    useUpdateProfile();

  const changePassword =
    useChangePassword();

  const deactivateAccount =
    useDeactivateAccount();


  async function handleDeactivate() {

    await deactivateAccount.mutateAsync();

    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  }


  if (isLoading) {

    return (

      <div
        className="
          rounded-2xl
          border
          bg-white
          p-10
          text-center
        "
      >
        Loading settings...
      </div>

    );

  }


  return (

    <div
      className="
        max-w-4xl
        space-y-6
      "
    >

      {/* HEADER */}
      <section>

        <h1
          className="
            text-3xl
            font-bold
          "
        >
          Settings
        </h1>

        <p
          className="
            mt-1
            text-sm
            text-gray-500
          "
        >
          Manage your account,
          security and preferences.
        </p>

      </section>


      <ProfileCard
        profile={profile}
        loading={
          updateProfile.isPending
        }
        onSubmit={(payload) =>
          updateProfile.mutate(
            payload
          )
        }
      />


      <PasswordCard
        loading={
          changePassword.isPending
        }
        onSubmit={(payload) =>
          changePassword.mutate(
            payload
          )
        }
      />


      <DangerZoneCard
        loading={
          deactivateAccount.isPending
        }
        onDeactivate={
          handleDeactivate
        }
      />

    </div>

  );

}