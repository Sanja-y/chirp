import Head from "next/head";
import Link from "next/link";
import type { RouterOutputs, } from "~/utils/api";
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import Image from "next/image";
dayjs.extend(relativeTime);


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

export default PostView;