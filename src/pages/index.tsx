'use client'
import Head from "next/head";
import Link from "next/link";
import Loading, { LoadingSpinner } from "~/components/Loading";

import { api } from "~/utils/api";
import type { RouterOutputs, } from "~/utils/api";
import { SignInButton, SignOutButton, SignUp, useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import Image from "next/image";
import { NextPage } from "next";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
dayjs.extend(relativeTime);

export default function Home() {
  //states
  const [input, setInput] = useState<string>("");

  // const hello = api.post.hello.useQuery({ text: "from tRPC" });
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  // start fetching asap
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (!userLoaded && !postsLoading) return <div />




  type PostWithUser = RouterOutputs["post"]["getAll"][number];
  const PostView = (props: PostWithUser) => {
    const { post, author } = props;
    return (
      <div key={post.id} className="border-b border-slate-400 p-8 flex gap-3 overflow-hidden">
        <Image
          src={author?.imageUrl}
          alt={`${author.username}'s profile picture`}
          className="h-14 w-14 rounded-full"
          height={56}
          width={56}
        />
        <div className="flex flex-col">
          <div className="flex font-bold text-slate-300 gap-1">
            <Link href={`/@${author.username}`}>
              <span>{`@${author?.username}`}</span>
            </Link>
            <Link href={`/post/${post.id}`}>
              <span className="font-thin">{`· ${dayjs(post.createdAt).fromNow()}`}</span>
            </Link>
          </div>
          <span className="text-2xl">{post.content}</span>
        </div>
      </div>
    )
  }
  const CreatePostWizard = () => {
    const { user } = useUser();

    const ctx = api.useUtils();
    const { mutate, isPending: isPosting } = api.post.create.useMutation({
      onSuccess: () => {
        setInput("");
        ctx.post.getAll.invalidate();
      },
      onError: (e: any) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        if (errorMessage && errorMessage[0]) {
          toast.error(errorMessage[0])
        }
        else {
          toast.error("Failed to post. Please try again later.")

        }
      }
    });

    if (!user) return null;

    return (
      <div className="flex w-full gap-3">
        <Image
          src={user?.imageUrl}
          alt={`${user.username}'s profile picture`}
          className="h-14 w-14 rounded-full"
          height={56}
          width={56}
        />
        <input
          placeholder="Type some emojis!"
          className="grow bg-transparent outline-none"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (input !== "") {
                mutate({ content: input, name: "" });
              }
            }
          }}
          disabled={isPosting} />


        {
          input !== "" && !isPosting && (
            <button
              // type="submit"
              onClick={() => {
                mutate({
                  content: input,
                  name: ""
                })
              }}
            >Post</button>
          )
        }
        {
          isPosting && (
            <div className="flex justify-center items-center">
              <Loading size={20} />
            </div>
          )
        }
      </div>
    )
  }

  const Feed = () => {
    // const { data, isLoading: postsLoading } = api.post.getAll.useQuery();
    if (postsLoading) return <LoadingSpinner />

    if (!data) return <div>Something went wrong</div>

    return (
      <div className="flex flex-col">
        {
          data?.map((fullPost) => (
            <PostView {...fullPost} key={fullPost.post.id} />
          ))
        }
      </div>
    )
  }



  return (
    <>
      <PageLayout>
        <div className="flex border-b border-slate-400 p-4">
          {!isSignedIn && (
            <div className="flex justify-center">
              <SignInButton />
            </div>
          )}
          {isSignedIn && <CreatePostWizard />}
        </div>
        <Feed />
      </PageLayout>
    </>
  );
}
