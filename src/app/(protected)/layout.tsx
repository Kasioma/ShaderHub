import Header from "@/components/Header";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

type User = {
  id: string;
  image: string;
} | null;

export default async function layout({ children }: Props) {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return redirect("/");

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
    <div className="grid h-screen grid-rows-[auto_1fr]">
      <div>
        <Header user={await getUserData()}></Header>
      </div>
      <div className="overflow-auto">{children}</div>
    </div>
  );
}
