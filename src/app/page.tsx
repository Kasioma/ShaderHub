import Header from "@/components/Header";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

type User = {
  id: string;
  image: string;
} | null;

export default async function Page() {
  const getUserData = async (): Promise<User> => {
    const { sessionClaims } = await auth();
    if (sessionClaims)
      return {
        id: sessionClaims.id as string,
        image: sessionClaims.image as string,
      };
    return null;
  };

  return (
    <>
      <SignedOut>
        <Header user={null} />
      </SignedOut>
      <SignedIn>
        <Header user={await getUserData()} />
      </SignedIn>
    </>
  );
}
