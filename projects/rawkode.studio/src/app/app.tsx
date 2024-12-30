import type { OidcStandardClaimsWithRoles } from "@/lib/security";
import { StrictMode } from "react";
import SidebarLayout from "./layouts/sidebar-layout";
import IndexPage from "./pages/index-page";
import ActiveLivestreamPage from "./pages/livestreams/active-livestreams-page";
import ProfilePage from "./pages/profile-page";
import { BrowserRouter, Route, Routes } from "react-router";

interface Props {
  user: OidcStandardClaimsWithRoles;
  children: React.ReactNode;
}

export default function App({ user }: Props) {
  return (
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/">
            <Route
              index
              element={
                <SidebarLayout user={user} title="Index">
                  <IndexPage />
                </SidebarLayout>
              }
            />
            <Route
              path="profile"
              element={
                <SidebarLayout user={user} title="Profile">
                  <ProfilePage user={user} />
                </SidebarLayout>
              }
            />
            <Route path="livestreams">
              <Route
                path="active"
                element={
                  <SidebarLayout user={user} title="Active Livestreams">
                    <ActiveLivestreamPage />
                  </SidebarLayout>
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
}
