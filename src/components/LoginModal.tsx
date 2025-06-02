/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { toast } from "./toaster/use-toast";
import { X } from "lucide-react";

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

export default function LoginModal({ onSuccess, onClose }: Props) {
  const { signIn, isLoaded, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      console.log(email, password);
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid credentials",
        });
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const error = err as any;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const code = error?.errors?.[0]?.code;

      if (code === "session_exists") {
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Authentication failed",
        });
      }
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[75vh] min-h-[50vh] w-[30vw] overflow-y-auto rounded-xl bg-secondary p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={handleLogin}
          className="mx-auto flex flex-col  justify-center gap-4"
        >
          <h2 className="mb-4 text-lg font-bold">Re-authenticate</h2>
          <input
            className="mb-2 w-full border px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="mb-2 w-full border px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-between">
            <button
              className="rounded-full border px-4 py-1 text-text hover:bg-primary hover:text-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-1 text-secondary hover:opacity-80"
            >
              Confirm
            </button>
          </div>
        </form>
        <X
          onClick={onClose}
          className="absolute right-5 top-5 h-5 w-5 cursor-pointer text-text"
        />
      </div>
    </div>
  );
}
