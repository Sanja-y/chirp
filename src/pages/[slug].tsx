'use client'
import Head from "next/head";
import { api } from "~/utils/api";
import "@trpc/server/rpc"

import { PageLayout } from "~/components/layout";
import Image from "next/image";
import { LoadingSpinner } from "~/components/Loading";
import PostView from "~/components/postview";
import { GetStaticProps } from "next";
import { generateSSGHelper } from "~/server/api/helpers/ssgHelper";


const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.post.getPostByUserID.useQuery({
    userId: props.userId,
  });

  if (isLoading) return <LoadingSpinner />

  if (!data || data.length === 0) return <div>User has not posted</div>

  return <div className="flex flex-col">
    {
      data.map(fullPost => {
        return (
          <PostView {...fullPost} key={fullPost.post.id} />

        )
      })
    }
  </div>
};


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
        <ProfileFeed userId={data.id} /> 
      </PageLayout>
    </>
  );
}
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserbyUsername.prefetch({username})

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;


