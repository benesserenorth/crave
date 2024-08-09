import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm/sql';
import pg from 'pg'
import { z } from 'zod';

import { API_SECRET } from '$env/static/private';
import { procedure, protectedProcedure, router } from '$lib/server/trpc';

import { db } from '../db';
import { pendingUser, recipe, subscription, user } from '../db/schema';
import { count, partialRecipe, subscribed, user as userSelect } from '../db/select';
import { auth } from '../lucia';
import { PartialRecipe, User } from '../schema';
import { get } from '../sentry';

export default router({
	getByCode: procedure
		.meta({
			openapi: {
				method: 'GET',
				path: '/users/code/{code}',
				summary: 'Get user by code',
				description: 'Gets a user by their code',
				tags: ['user'],
			},
		})
		.input(z.object({ code: z.string().uuid() }))
		.output(User)
		.query(async ({ input }) => {
			const users = await get(db
				.select(userSelect)
				.from(pendingUser)
				.innerJoin(user, eq(user.id, pendingUser.userId))
				.where(eq(pendingUser.code, input.code)));

			if (!users.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found.',
				});
			}

			return users[0];
		}),
	create: procedure
		.meta({
			openapi: {
				method: 'POST',
				path: '/users',
				summary: 'Create user',
				description: 'Creates a new user',
				tags: ['user'],
			},
		})
		.input(User.pick({
			username: true,
			name: true,
		}).extend({
			code: z.string().uuid(),
			secret: z.string(),
		}))
		.output(z.void())
		.mutation(async ({ input }) => {
			if (input.secret !== API_SECRET) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Invalid secret.',
				});
			}

			try {
				const username = input.username.toLowerCase();
				await auth.createUser({
					key: {
						providerId: 'username',
						providerUserId: username,
						password: input.code,
					},
					attributes: {
						username,
						name: input.name,
						thumbnail: null,
					},
				});
			} catch (e) {
				if (
					e instanceof pg.DatabaseError &&
        e.constraint
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'Username already taken.',
					});
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An unknown error occurred.',
				});
			}
		}),
	update: protectedProcedure
		.meta({
			openapi: {
				method: 'POST',
				path: '/users/me',
				summary: 'Update user',
				description: 'Updates the current user\'s profile',
				tags: ['user'],
			},
		})
		.input(User.pick({
			name: true,
			thumbnail: true,
			username: true,
		}).extend({
			password: z.string().optional(),
		}))
		.output(z.void())
		.mutation(async ({ ctx, input }) => {
			try {
				await get(db
					.update(user)
					.set(input)
					.where(eq(user.id, ctx.session.user.userId)));

				if (input.password) {
					await auth.updateKeyPassword('username', ctx.session.user.username, input.password);
				}
			} catch (e) {
				if (
					e instanceof pg.DatabaseError &&
					e.constraint
				) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'Username already taken.',
					});
				}

				throw e;
			}
		}),
	subscribe: protectedProcedure
		.meta({
			openapi: {
				method: 'POST',
				path: '/users/@{username}/subscribe',
				summary: 'Subscribe',
				description: 'Subscribes to a user.',
				tags: ['user'],
			},
		})
		.input(z.object({ username: z.string().toLowerCase() }))
		.output(z.void())
		.mutation(async ({ ctx, input }) => {
			const users = await get(db
				.select({
					id: user.id,
				})
				.from(user)
				.where(eq(user.username, input.username)));

			if (!users.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found.',
				});
			}

			if (users[0].id === ctx.session.user.userId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'You cannot subscribe to yourself.',
				});
			}

			await get(db
				.insert(subscription)
				.values({
					userId: ctx.session.user.userId,
					channelId: users[0].id,
				})
				.onConflictDoNothing());
		}),
	unsubscribe: protectedProcedure
		.meta({
			openapi: {
				method: 'POST',
				path: '/users/@{username}/unsubscribe',
				summary: 'Unsubscribe',
				description: 'Unsubscribes from a user.',
				tags: ['user'],
			},
		})
		.input(z.object({ username: z.string().toLowerCase() }))
		.output(z.void())
		.mutation(async ({ ctx, input }) => {
			const users = await get(db
				.select({
					id: user.id,
				})
				.from(user)
				.where(eq(user.username, input.username)));

			if (!users.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found.',
				});
			}

			if (users[0].id === ctx.session.user.userId) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'You cannot unsubscribe from yourself.',
				});
			}

			await get(db
				.delete(subscription)
				.where(and(
					eq(subscription.userId, ctx.session.user.userId),
					eq(subscription.channelId, users[0].id),
				)));
		}),
	get: procedure
		.meta({
			openapi: {
				method: 'GET',
				path: '/users/@{username}',
				summary: 'Get user',
				description: 'Gets a user\'s profile',
				tags: ['user'],
			},
		})
		.input(z.object({ username: z.string().toLowerCase() }))
		.output(User)
		.query(async ({ ctx, input }) => {
			const users = await get(db
				.select({
					...userSelect,
					subscribed: subscribed(ctx.session?.user.userId),
					recipes: sql<number>`${db
						.select({ value: count() })
						.from(recipe)
						.where(eq(recipe.authorId, user.id))}`,
					subscribers: sql<number>`${db
						.select({ value: count() })
						.from(subscription)
						.where(eq(subscription.channelId, user.id))}`,
				})
				.from(user)
				.where(eq(user.username, input.username)));

			if (!users.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User not found.',
				});
			}

			return users[0];
		}),
	recipes: procedure
		.meta({
			openapi: {
				method: 'GET',
				path: '/users/@{username}/recipes',
				summary: 'Get user recipes',
				description: 'Gets a user\'s recipes',
				tags: ['user'],
			},
		})
		.input(z.object({ username: z.string().toLowerCase(), page: z.number().int().nonnegative().default(0) }))
		.output(PartialRecipe.array())
		.query(async ({ input }) => {
			const authorId = db
				.select({
					id: user.id,
				})
				.from(user)
				.where(eq(user.username, input.username));

			const recipes = await get(db
				.select(partialRecipe)
				.from(recipe)
				.innerJoin(user, eq(recipe.authorId, user.id))
				.where(eq(recipe.authorId, authorId))
				.orderBy(desc(recipe.createdAt), asc(recipe.id))
				.offset(input.page * 25)
				.limit(25));

			return recipes;
		}),
	subscriptions: protectedProcedure
		.meta({
			openapi: {
				method: 'GET',
				path: '/users/me/subscriptions',
				summary: 'Get subscriptions',
				description: 'Gets the current user\'s subscriptions.',
				tags: ['user'],
			},
		})
		.input(z.void())
		.output(User.array())
		.query(async ({ ctx }) => {
			const subscriptions = db
				.select({
					channelId: subscription.channelId,
				})
				.from(subscription)
				.where(eq(subscription.userId, ctx.session.user.userId));

			return await get(db
				.select(userSelect)
				.from(user)
				.where(inArray(user.id, subscriptions)));
		}),
});
