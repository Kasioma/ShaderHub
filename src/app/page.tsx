import { HydrateClient } from "@/trpc/server";
import Header from "@/components/Header";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import ObjectGrid from "@/components/ObjectGrid";
import { api } from "@/trpc/server";

type User = {
  id: string;
  image: string;
} | null;

export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const getUserData = async (): Promise<User> => {
    const { sessionClaims } = await auth();
    if (sessionClaims)
      return {
        id: sessionClaims.id as string,
        image: sessionClaims.image as string,
      };
    return null;
  };

  const objects = await api.main.queryInitialObjects();
  const APIInputData = new FormData();
  objects.forEach((object) => {
    APIInputData.append("thumbnails", object.id);
  });
  console.log(baseUrl);
  const thumbnails = await fetch(`${baseUrl}/api/filestorage/thumbnail/query`, {
    method: "POST",
    body: APIInputData,
  });
  if (!thumbnails.ok) {
    throw new Error("Bad Request.");
  } else {
    console.log(thumbnails.json());
  }
  return (
    <HydrateClient>
      <main className="dark">
        <SignedOut>
          <Header user={null} />
        </SignedOut>
        <SignedIn>
          <Header user={await getUserData()} />
        </SignedIn>
        <ObjectGrid objects={objects} />
      </main>
    </HydrateClient>
  );
}
