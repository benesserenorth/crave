<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { trpc } from '$lib/client';
	import Blob from '$lib/components/blob/Blob.svelte';
	import { t } from '$lib/translations';

	import type { ActionData } from './$types';

	let code = $page.url.searchParams.get('code');

	let showPassword = false;
	let width = 0;
	let height = 0;
	let loading = false;

	let username = '';

	$: if (code) {
		trpc.users.getByCode
			.query({ code })
			.then((user) => {
				username = user.username;
			})
			.catch(() => {
				// do nothing
			});
	}

	export let form: ActionData;
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

<div class="absolute top-0 left-0 -z-10">
	<Blob {width} {height} colour="oklab(0.67059 -0.150002 -0.00946361)" />
</div>

<div
	class="flex flex-col gap-8 justify-center place-items-center min-h-screen px-8"
>
	<form
		class="w-full max-w-md form-control gap-1 z-10 bg-base-300 rounded-3xl p-8"
		method="post"
		use:enhance={() => {
			loading = true;

			return ({ update }) => {
				loading = false;
				update();
			};
		}}
	>
		{#if form?.message}
			<div class="alert alert-error">{form.message}</div>
		{/if}

		{#if username}
			<input type="text" name="code" bind:value={code} hidden />
		{/if}

		<label class="label" for="username">
			<span class="label-text font-bold text-neutral-900 dark:text-neutral-100">
				{$t('label.username')}
			</span>
		</label>
		<input
			type="text"
			name="username"
			placeholder={$t('placeholder.username')}
			class="input input-bordered"
			required
			bind:value={username}
			maxlength={39}
		/>

		<label class="label" for="password">
			<span class="label-text font-bold text-neutral-900 dark:text-neutral-100">
				{$t('label.password')}
			</span>
			<button
				type="button"
				class="label-text flex flex-row gap-1 place-items-center text-xs"
				on:click={() => (showPassword = !showPassword)}
			>
				{#if showPassword}
					<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24">
						<path
							d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
						/>
					</svg>

					{$t('auth.hide')}
				{:else}
					<svg class="h-4 w-4 fill-current" viewBox="0 0 24 24">
						<path
							d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
						/>
					</svg>

					{$t('auth.show')}
				{/if}
			</button>
		</label>
		<input
			type={showPassword ? 'text' : 'password'}
			name="password"
			class="input input-bordered"
			placeholder={$t('placeholder.password')}
			required
			maxlength={255}
		/>

		<button class="btn btn-primary mt-4" type="submit">
			{#if loading}
				<span class="loading loading-ball loading-md" />
			{/if}

			{$t('auth.log-in')}
		</button>
	</form>
</div>
