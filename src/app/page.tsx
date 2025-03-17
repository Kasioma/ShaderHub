import Header from "@/components/Header";
import { SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { sessionClaims } = await auth();
  console.log(sessionClaims);
  return (
    <>
      <SignedOut>
        <Header user={null} />
      </SignedOut>
      {/* <SignedIn>
        <Header />
      </SignedIn> */}
    </>
  );
}
