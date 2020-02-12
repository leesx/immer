import {
	ImmerState,
	Patch,
	ImmerScope,
	Drafted,
	AnyObject,
	ImmerBaseState,
	AnyArray,
	AnyMap,
	DRAFT_STATE,
	AnySet,
	get,
	each,
	has,
	die,
	getArchtype,
	ProxyType,
	Archtype,
	isSet,
	isMap,
	isDraft,
	isDraftable,
	isEnumerable,
	shallowCopy,
	latest,
	createHiddenProperty,
	assertUnrevoked,
	is,
	createProxy,
	iteratorSymbol
} from "./internal"

/** Plugin utilities */
const plugins: {
	patches?: {
		generatePatches: typeof generatePatches
		applyPatches: typeof applyPatches
	}
	es5?: {
		willFinalizeES5: typeof willFinalizeES5
		createES5Proxy: typeof createES5Proxy
		markChangedES5: typeof markChangedES5
	}
	mapset?: {
		proxyMap: typeof proxyMap
		proxySet: typeof proxySet
	}
} = {}

type Plugins = typeof plugins

export function getPlugin<K extends keyof Plugins>(
	pluginKey: K
): Exclude<Plugins[K], undefined> {
	const plugin = plugins[pluginKey]
	if (!plugin) {
		throw new Error(
			`The plugin ${pluginKey} has not been loaded into Immer. Make sure the require from "immer/${pluginKey}" when initializing your application, just after requiring immer itself.`
		)
	}
	// @ts-ignore
	return plugin
}

function buildUtilities() {
	return {
		get,
		each,
		has,
		die,
		getArchtype,
		ProxyType,
		Archtype,
		isSet,
		isMap,
		isDraft,
		isDraftable,
		isEnumerable,
		shallowCopy,
		latest,
		createHiddenProperty,
		ImmerScope,
		DRAFT_STATE,
		assertUnrevoked,
		is,
		iteratorSymbol,
		createProxy
	} as const
}

let utilities: ReturnType<typeof buildUtilities> | undefined = undefined

export function __loadPlugin<K extends keyof Plugins>(
	pluginKey: K,
	getImplementation: (core: typeof utilities) => Plugins[K]
): void {
	if (!utilities) {
		utilities = buildUtilities()
	}
	plugins[pluginKey] = getImplementation(utilities)
}

/** ES5 Plugin */

interface ES5BaseState extends ImmerBaseState {
	finalizing: boolean
	assigned: {[key: string]: any}
	parent?: ImmerState
	revoked: boolean
}

export interface ES5ObjectState extends ES5BaseState {
	type: ProxyType.ES5Object
	draft: Drafted<AnyObject, ES5ObjectState>
	base: AnyObject
	copy: AnyObject | null
}

export interface ES5ArrayState extends ES5BaseState {
	type: ProxyType.ES5Array
	draft: Drafted<AnyObject, ES5ArrayState>
	base: AnyArray
	copy: AnyArray | null
}

export function willFinalizeES5(
	scope: ImmerScope,
	result: any,
	isReplaced: boolean
) {
	getPlugin("es5").willFinalizeES5(scope, result, isReplaced)
}

export function createES5Proxy<T>(
	base: T,
	parent?: ImmerState
): Drafted<T, ES5ObjectState | ES5ArrayState> {
	return getPlugin("es5").createES5Proxy(base, parent)
}

export function markChangedES5(state: ImmerState) {
	getPlugin("es5").markChangedES5(state)
}

/** Map / Set plugin */

export interface MapState extends ImmerBaseState {
	type: ProxyType.Map
	copy: AnyMap | undefined
	assigned: Map<any, boolean> | undefined
	base: AnyMap
	revoked: boolean
	draft: Drafted<AnyMap, MapState>
}

export interface SetState extends ImmerBaseState {
	type: ProxyType.Set
	copy: AnySet | undefined
	base: AnySet
	drafts: Map<any, Drafted> // maps the original value to the draft value in the new set
	revoked: boolean
	draft: Drafted<AnySet, SetState>
}

export function proxyMap<T extends AnyMap>(
	target: T,
	parent?: ImmerState
): T & {[DRAFT_STATE]: MapState} {
	return getPlugin("mapset").proxyMap(target, parent)
}

export function proxySet<T extends AnySet>(
	target: T,
	parent?: ImmerState
): T & {[DRAFT_STATE]: SetState} {
	return getPlugin("mapset").proxySet(target, parent)
}

/** Patches plugin */

export type PatchPath = (string | number)[]

export function generatePatches(
	state: ImmerState,
	basePath: PatchPath,
	patches: Patch[],
	inversePatches: Patch[]
): void {
	getPlugin("patches").generatePatches(state, basePath, patches, inversePatches)
}

export function applyPatches<T>(draft: T, patches: Patch[]): T {
	return getPlugin("patches").applyPatches(draft, patches)
}
