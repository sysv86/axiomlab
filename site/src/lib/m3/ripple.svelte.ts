/**
 * M3 state layer + press ripple as a Svelte attachment.
 *
 *   <button class="rounded-full ..." {@attach ripple()}>…</button>
 *   <div role="button" tabindex="0" {@attach ripple({ color: 'var(--md-sys-color-primary)' })}>…</div>
 *   <a href="/x" {@attach stateLayer()}>…</a>            // hover/focus/pressed layer, no ripple
 *
 * Port of material-web `md-ripple` behaviour (docs/research/motion.md §4.2) with current m3 opacities
 * (hover 8%, focus 10%, pressed 10%; color.md §3.1). The overlay is a `<span data-m3-ripple>` styled in
 * src/routes/layout.css: absolutely positioned, `inset: 0`, `border-radius: inherit`, `overflow: hidden`,
 * `pointer-events: none`, painted in `currentColor` (or `options.color`). The host is marked
 * `data-m3-ripple-host`; a base-layer rule in layout.css makes it `position: relative` unless any
 * utility / component style positions it (so an `absolute` / `fixed` / `sticky` host keeps its
 * position, even if that class is toggled after the attachment ran).
 */
import type { Attachment } from 'svelte/attachments';

/** material-web ripple constants (ripple/internal/ripple.ts). */
export const RIPPLE_TIMING = {
	/** Press grow duration (ms), standard easing. */
	pressGrowMs: 450,
	/** The pressed state is held at least this long (ms) so quick taps still show a ripple. */
	minimumPressMs: 225,
	/** Touch delay (ms) so scrolling doesn't flash ripples. */
	touchDelayMs: 150,
	/** Initial ripple diameter = max(w, h) × this. */
	initialOriginScale: 0.2,
	/** Extra radius beyond the corner (px). */
	padding: 10,
	softEdgeMinimumSize: 75,
	softEdgeContainerRatio: 0.35,
	/** md.sys.motion.easing.standard */
	easing: 'cubic-bezier(0.2, 0, 0, 1)'
	// Fade-in 105ms / fade-out 375ms linear, hover 15ms linear: CSS transitions in layout.css.
} as const;

export interface RippleOptions {
	/** State-layer / ripple color. Default `currentColor` (the content color, per spec). Any CSS color. */
	color?: string;
	/** Disable all feedback (in addition to `[disabled]`, `aria-disabled="true"`, `data-disabled` on the host). */
	disabled?: boolean;
	/** Always grow the ripple from the center instead of the pointer position. */
	centered?: boolean;
}

const State = {
	Inactive: 0,
	TouchDelay: 1,
	Holding: 2,
	WaitingForClick: 3,
	KeyHolding: 4
} as const;
type State = (typeof State)[keyof typeof State];

const DISABLED_SELECTOR = "[disabled], [aria-disabled='true'], [data-disabled]:not([data-disabled='false'])";

function reducedMotion() {
	return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isActivationKey(e: KeyboardEvent) {
	return e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar';
}

function create(withRipple: boolean, options: RippleOptions): Attachment<HTMLElement> {
	return (host) => {
		const layer = document.createElement('span');
		layer.setAttribute('data-m3-ripple', '');
		layer.setAttribute('aria-hidden', 'true');
		if (!withRipple) layer.setAttribute('data-no-ripple', '');
		if (options.color) layer.style.setProperty('--m3-ripple-color', options.color);
		host.prepend(layer);

		// Static hosts become `position: relative` through `[data-m3-ripple-host]` in layout.css
		// (@layer base, so any positioning utility on the host still wins). Count nested attachments
		// on the same host so removing one doesn't drop the marker the other still needs.
		const hostCount = Number(host.dataset.m3RippleHost || 0) + 1;
		host.dataset.m3RippleHost = String(hostCount);

		let state: State = State.Inactive;
		let startEvent: PointerEvent | null = null;
		let grow: Animation | null = null;
		let pressedAt = 0;
		let endTimer: ReturnType<typeof setTimeout> | undefined;
		let touchTimer: ReturnType<typeof setTimeout> | undefined;
		let ignoreNextKeyClick = false;

		const isDisabled = () => !!options.disabled || host.matches(DISABLED_SELECTOR);
		const setFlag = (name: 'hovered' | 'focused' | 'pressed', on: boolean) => layer.toggleAttribute(`data-${name}`, on);

		function startPress(event?: PointerEvent | null) {
			clearTimeout(endTimer);
			setFlag('pressed', true);
			pressedAt = performance.now();
			if (!withRipple) return;

			// Measure the overlay itself (it fills the host's padding box, like md-ripple's surface).
			// Work in the layer's local (untransformed) pixels so the ripple stays under the pointer
			// inside scaled ancestors such as the mobile phone frame.
			const rect = layer.getBoundingClientRect();
			const width = layer.offsetWidth || rect.width;
			const height = layer.offsetHeight || rect.height;
			const scaleX = rect.width ? width / rect.width : 1;
			const scaleY = rect.height ? height / rect.height : 1;
			const maxDim = Math.max(width, height);
			const softEdge = Math.max(RIPPLE_TIMING.softEdgeContainerRatio * maxDim, RIPPLE_TIMING.softEdgeMinimumSize);
			const initialSize = Math.max(1, Math.floor(maxDim * RIPPLE_TIMING.initialOriginScale));
			const maxRadius = Math.sqrt(width ** 2 + height ** 2) + RIPPLE_TIMING.padding;
			const scale = (maxRadius + softEdge) / initialSize;

			let sx = width / 2;
			let sy = height / 2;
			if (event && !options.centered) {
				sx = (event.clientX - rect.left) * scaleX;
				sy = (event.clientY - rect.top) * scaleY;
			}
			const start = `${sx - initialSize / 2}px, ${sy - initialSize / 2}px`;
			const end = `${(width - initialSize) / 2}px, ${(height - initialSize) / 2}px`;
			const size = `${initialSize}px`;

			grow?.cancel();
			grow = layer.animate(
				{
					top: [0, 0],
					left: [0, 0],
					height: [size, size],
					width: [size, size],
					transform: [`translate(${start}) scale(1)`, `translate(${end}) scale(${scale})`]
				},
				{
					pseudoElement: '::after',
					duration: reducedMotion() ? 0 : RIPPLE_TIMING.pressGrowMs,
					easing: RIPPLE_TIMING.easing,
					fill: 'forwards'
				}
			);
		}

		function endPress() {
			startEvent = null;
			state = State.Inactive;
			const elapsed = performance.now() - pressedAt;
			clearTimeout(endTimer);
			if (elapsed >= RIPPLE_TIMING.minimumPressMs) {
				setFlag('pressed', false);
				return;
			}
			endTimer = setTimeout(() => setFlag('pressed', false), RIPPLE_TIMING.minimumPressMs - elapsed);
		}

		function cancelAll() {
			state = State.Inactive;
			startEvent = null;
			clearTimeout(endTimer);
			clearTimeout(touchTimer);
			setFlag('hovered', false);
			setFlag('focused', false);
			setFlag('pressed', false);
		}

		const shouldReact = (e: PointerEvent) => e.isPrimary && !isDisabled();

		function onPointerEnter(e: PointerEvent) {
			if (!shouldReact(e) || e.pointerType === 'touch') return;
			setFlag('hovered', true);
		}

		function onPointerLeave(e: PointerEvent) {
			if (!e.isPrimary) return;
			setFlag('hovered', false);
			if (state !== State.Inactive && state !== State.KeyHolding) endPress();
		}

		function onPointerDown(e: PointerEvent) {
			if (!shouldReact(e)) return;
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			startEvent = e;
			if (e.pointerType !== 'touch') {
				state = State.WaitingForClick;
				startPress(e);
				return;
			}
			state = State.TouchDelay;
			clearTimeout(touchTimer);
			touchTimer = setTimeout(() => {
				if (state !== State.TouchDelay) return;
				state = State.Holding;
				startPress(e);
			}, RIPPLE_TIMING.touchDelayMs);
		}

		function onPointerUp(e: PointerEvent) {
			if (!e.isPrimary) return;
			if (state === State.Holding) {
				endPress();
			} else if (state === State.TouchDelay) {
				// quick tap: show the ripple now, release on click
				state = State.WaitingForClick;
				startPress(startEvent);
			}
			if (state === State.WaitingForClick) {
				// Fallback in case `click` never reaches the host (e.g. a child stops propagation).
				const ev = startEvent;
				setTimeout(() => {
					if (state === State.WaitingForClick && startEvent === ev) endPress();
				}, 0);
			}
		}

		function onClick(e: MouseEvent) {
			if (isDisabled()) return;
			if (state === State.WaitingForClick) {
				endPress();
				return;
			}
			if (state === State.KeyHolding) return;
			if (ignoreNextKeyClick && e.detail === 0) {
				ignoreNextKeyClick = false;
				return;
			}
			if (state === State.Inactive) {
				// keyboard / programmatic click: centered press + release
				startPress();
				endPress();
			}
		}

		function onKeyDown(e: KeyboardEvent) {
			if (e.repeat || !isActivationKey(e) || isDisabled() || e.target !== host) return;
			if (state !== State.Inactive) return;
			state = State.KeyHolding;
			startPress();
		}

		function onKeyUp(e: KeyboardEvent) {
			if (!isActivationKey(e) || state !== State.KeyHolding) return;
			endPress();
			// Space on a native button dispatches `click` after keyup — don't ripple twice.
			ignoreNextKeyClick = true;
			setTimeout(() => (ignoreNextKeyClick = false), 0);
		}

		function onFocusIn() {
			if (isDisabled()) return;
			let visible = false;
			try {
				visible = host.matches(':focus-visible') || host.matches(':has(:focus-visible)');
			} catch {
				visible = host.matches(':focus-visible');
			}
			setFlag('focused', visible);
		}

		function onFocusOut(e: FocusEvent) {
			if (e.relatedTarget instanceof Node && host.contains(e.relatedTarget)) return;
			setFlag('focused', false);
			if (state === State.KeyHolding) endPress();
		}

		function onCancel() {
			if (state !== State.Inactive) endPress();
		}

		const listeners: [string, EventListener][] = [
			['pointerenter', onPointerEnter as EventListener],
			['pointerleave', onPointerLeave as EventListener],
			['pointerdown', onPointerDown as EventListener],
			['pointerup', onPointerUp as EventListener],
			['pointercancel', onCancel],
			['contextmenu', onCancel],
			['click', onClick as EventListener],
			['keydown', onKeyDown as EventListener],
			['keyup', onKeyUp as EventListener],
			['focusin', onFocusIn],
			['focusout', onFocusOut as EventListener]
		];
		for (const [type, fn] of listeners) host.addEventListener(type, fn);

		// If the host becomes disabled while hovered/focused/pressed, drop the feedback.
		const observer = new MutationObserver(() => {
			if (isDisabled()) cancelAll();
		});
		observer.observe(host, { attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'data-disabled'] });

		return () => {
			for (const [type, fn] of listeners) host.removeEventListener(type, fn);
			observer.disconnect();
			clearTimeout(endTimer);
			clearTimeout(touchTimer);
			grow?.cancel();
			layer.remove();
			const left = Number(host.dataset.m3RippleHost || 1) - 1;
			if (left > 0) host.dataset.m3RippleHost = String(left);
			else delete host.dataset.m3RippleHost;
		};
	};
}

/** M3 state layer (hover 8% / focus-visible 10%) + expanding press ripple (10%). */
export function ripple(options: RippleOptions = {}): Attachment<HTMLElement> {
	return create(true, options);
}

/** Lighter variant: hover / focus-visible / pressed state layer without the expanding ripple. */
export function stateLayer(options: Omit<RippleOptions, 'centered'> = {}): Attachment<HTMLElement> {
	return create(false, options);
}
