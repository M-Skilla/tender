import { signOut } from "@/app/actions/session";
import { currentUser } from "@/lib/auth";
import { Button } from "../Button/Button";
import { NavigationBar, type NavSection } from "./NavigationBar";

/** The navigation bar with the signed-in user read from the session (server components only). */
export async function SiteHeader({ active }: { active?: NavSection }) {
  const user = await currentUser();
  return (
    <NavigationBar
      active={active}
      user={user ? { name: user.name, role: user.role } : undefined}
      signOut={
        <form action={signOut}>
          <Button type="submit" variant="text" size="small">
            Sign out
          </Button>
        </form>
      }
    />
  );
}
