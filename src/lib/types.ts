export type Size =
	| 'sm'
	| 'md'
	| 'lg'
	| 'xl'
	| '2xl'
	| '3xl'
	| '4xl'
	| '5xl'
	| '6xl'
	| '7xl'
	| 'full';

export type MaybePromise<T> = T | Promise<T>;
