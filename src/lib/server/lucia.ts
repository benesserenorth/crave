import { pg } from "@lucia-auth/adapter-postgresql";
import { github, google } from "@lucia-auth/oauth/providers";
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";

import { dev } from "$app/environment";
import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
} from "$env/static/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { pool } from "$lib/server/db";

export const auth = lucia({
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit(),
	adapter: pg(pool, {
		user: "user",
		key: "user_key",
		session: "user_session",
	}),
	getUserAttributes: (data) => {
		return {
			username: data.username,
			name: data.name,
			thumbnail: data.thumbnail,
			admin: data.admin,
		};
	},
});

export const githubAuth = github(auth, {
	clientId: GITHUB_CLIENT_ID,
	clientSecret: GITHUB_CLIENT_SECRET,
});

export const googleAuth = google(auth, {
	clientId: GOOGLE_CLIENT_ID,
	clientSecret: GOOGLE_CLIENT_SECRET,
	redirectUri: new URL("/login/google/callback", PUBLIC_BASE_URL).href,
});

export type Auth = typeof auth;
