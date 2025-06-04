import Header from "@/components/Header";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

type User = {
  id: string;
  image: string;
  roles: string[];
} | null;

export default async function layout({ children }: Props) {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return redirect("/");
  if ((sessionClaims.roles as string[]).includes("admin") === false)
    return redirect("/");

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

  return (
    <div className="grid h-screen grid-rows-[auto_1fr]">
      <div>
        <Header user={await getUserData()}></Header>
      </div>
      <div className="min-h-0 overflow-auto">{children}</div>
    </div>
  );
}
