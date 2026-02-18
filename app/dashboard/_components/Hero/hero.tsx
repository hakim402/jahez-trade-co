import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

export default async function Hero() {
  const { userId } = await auth(); 

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return <div>User not found</div>;
  }
  return (
    <section className="relative overflow-hidden">
      <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
        <div className="sm:text-center lg:text-left">
          <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-4xl">
            <span className="block xl:inline dark:text-white">
              Welcome Back {user.fullName} "{user.role}"{" "}
            </span>{" "}
          </h1>
          <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
            Your AI-powered interview practice platform to help you ace your
            next job interview with confidence.
          </p>
        </div>
      </div>
    </section>
  );
}
