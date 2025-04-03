import { initTRPC, TRPCError } from "@trpc/server";
import type { OpenApiMeta } from "trpc-openapi";

import type { Context } from "$lib/server/context";

const t = initTRPC
	.context<Context>()
	.meta<OpenApiMeta>()
	.create({
		errorFormatter({ shape, error }) {
			return {
				...shape,
				// @ts-expect-error - `issues` is not in the type definition
				message: error.cause?.issues?.[0].message ?? error.message,
			};
		},
	});

export const middleware = t.middleware;
export const router = t.router;

const isAuthenticated = middleware((opts) => {
	if (opts.ctx.session === null || !opts.ctx.session.user)
		throw new TRPCError({ code: "UNAUTHORIZED" });

	return opts.next({
		ctx: {
			session: {
				user: opts.ctx.session.user,
				expires: opts.ctx.session.expires,
			},
		},
	});
});

const isAdmin = middleware((opts) => {
	if (opts.ctx.session === null || !opts.ctx.session.user)
		throw new TRPCError({ code: "UNAUTHORIZED" });
	if (!opts.ctx.session.user.admin) throw new TRPCError({ code: "FORBIDDEN" });

	return opts.next({
		ctx: opts.ctx,
	});
});

export const procedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const adminProcedure = protectedProcedure.use(isAdmin);
