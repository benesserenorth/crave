import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { LuciaError } from 'lucia';
import { z } from 'zod';

import { db } from '$lib/server/db';
import { pendingUser } from '$lib/server/db/schema';
import { auth } from '$lib/server/lucia';
import { redirectWithQuery } from '$lib/server/url';

import type { Actions, PageServerLoad } from './$types';

const Input = z.object({
	username: z.string().min(4, 'Username must be at least 4 characters.').max(39, 'Username cannot be more than 39 characters.'),
	password: z.string().min(8, 'Password must be at least 8 characters.').max(255, 'Password cannot be more than 255 characters.'),
	code: z.string().nullable(),
});

export const load = (async ({ locals, url }) => {
	const session = await locals.auth.validate();
	if (session) return redirectWithQuery(url, '/recipes');

	return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		const code = formData.get('code') || null;

		const result = Input.safeParse({
			username,
			password,
			code,
		});

		if (!result.success) {
			return fail(400, {
				message: result.error.issues[0].message,
			});
		}

		try {
			const key = await auth.useKey(
				'username',
				result.data.username.toLowerCase(),
				result.data.code ?? result.data.password,
			);

			if (result.data.code) {
				// update password
				await auth.updateKeyPassword('username', key.userId, result.data.password);

				// delete code
				await db.delete(pendingUser).where(eq(pendingUser.code, result.data.code));
			}

			const session = await auth.createSession({
				userId: key.userId,
				attributes: {},
			});

			locals.auth.setSession(session);
		} catch (e) {
			if (
				e instanceof LuciaError &&
				(e.message === 'AUTH_INVALID_KEY_ID' ||
					e.message === 'AUTH_INVALID_PASSWORD')
			) {
				return fail(400, {
					message: 'Incorrect username or password',
				});
			}

			return fail(500, {
				message: 'An unknown error occurred',
			});
		}

		return redirectWithQuery(url, '/recipes');
	},
};
