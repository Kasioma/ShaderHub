import { HydrateClient } from "@/trpc/server";
import Header from "@/components/Header";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import ObjectGrid from "@/components/ObjectGrid";
import TagRow from "@/components/TagRow";

type User = {
  id: string;
  image: string;
  roles: string[];
} | null;

export default async function Home() {
  const getUserData = async (): Promise<User> => {
    const { sessionClaims } = await auth();
    if (sessionClaims)
      return {
        id: sessionClaims.id as string,
        image: sessionClaims.image as string,
        roles: sessionClaims.roles as string[],
      };
    return null;
  };

  const user = await getUserData();

  return (
    <HydrateClient>
      <main className="dark">
        <SignedOut>
          <Header user={null} />
        </SignedOut>
        <SignedIn>
          <Header user={user} />
        </SignedIn>
        <TagRow userId={user?.id ?? null} />
        <ObjectGrid />
      </main>
    </HydrateClient>
  );
}
