'use client'
import Head from "next/head";
import { api } from "~/utils/api";
import "@trpc/server/rpc"
import { createServerSideHelpers } from '@trpc/react-query/server';
import { createContext } from "react";
import superjson from 'superjson';
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import { GetStaticProps } from "next";
import { PageLayout } from "~/components/layout";
import Image from "next/image";


function ProfilePage() {
  const { data, isLoading } = api.profile.getUserbyUsername.useQuery({
    username: "sanja-y"
  });

  if (isLoading) return <div>Loading...</div>

  if (!data) return <div>404</div>

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="bg-slate-600
        h-36 relative">
          <Image
            src={data.imageUrl}
            alt={`${data.username ?? ""}'s profile pic`}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-[64px] rounded-full ml-4 border-black border-4 bg-black"

          />
        </div>

        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl">{`@${data.username}`}</div>
        <div className="w-full border-b border-slate-400" />
      </PageLayout>
    </>
  );
}
export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers(
    {
      router: appRouter,
      ctx: { db, currentUserID: null },
      transformer: superjson, // optional - adds superjson serialization
    }
  );
  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "")

  await ssg.profile.getUserbyUsername.prefetch({ username })

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username
    },
  }
}

export default ProfilePage;


