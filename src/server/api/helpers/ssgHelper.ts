import { createServerSideHelpers } from '@trpc/react-query/server';
import { createContext } from "react";
import superjson from 'superjson';
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import { GetStaticProps } from "next";

export const generateSSGHelper =  () => {
    const ssg = createServerSideHelpers(
        {
            router: appRouter,
            ctx: { db, currentUserID: null },
            transformer: superjson, // optional - adds superjson serialization
        }
    );
    return ssg;
}