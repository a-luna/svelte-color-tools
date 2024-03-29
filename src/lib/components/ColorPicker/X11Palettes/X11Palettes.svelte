<script lang="ts">
	import X11Swatches from '$lib/components/ColorPicker/X11Palettes/X11Swatches.svelte';
	import ChevronLeft from '$lib/components/Icons/ChevronLeft.svelte';
	import ChevronRight from '$lib/components/Icons/ChevronRight.svelte';
	import Close from '$lib/components/Icons/Close.svelte';
	import Palette from '$lib/components/Shared/Palettes/Palette.svelte';
	import type { ColorPalette, ComponentColor } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

	export let x11ColorPalettes: ColorPalette[];
	let x11PaletteMap: Record<string, number> = {} as Record<string, number>;
	let paletteColor: ComponentColor = 'red';
	let activePaletteId: string;

	let carouselElement: HTMLDivElement;
	let carouselItemSize: number;
	const hideX11PalettesEventDispatcher = createEventDispatcher<{ hideX11Palettes: {} }>();

	if (x11ColorPalettes) {
		x11ColorPalettes.forEach((p, i) => (x11PaletteMap[p.id] = i));
		activePaletteId = x11ColorPalettes[0].id;
	}

	$: if (carouselElement) carouselItemSize = carouselElement.querySelector('.carousel-item').clientWidth;
	$: activePaletteIndex = x11PaletteMap?.[activePaletteId] ?? 0;
	$: paletteColor = x11ColorPalettes?.[activePaletteIndex]?.componentColor || 'red';

	function scrollToPreviousPalette() {
		const goToPaletteIndex = activePaletteIndex !== 0 ? activePaletteIndex - 1 : x11ColorPalettes.length - 1;
		const goToPaletteId = x11ColorPalettes.at(goToPaletteIndex).id;
		scrollToSelectedPalette(goToPaletteId);
	}

	function scrollToNextPalette() {
		const goToPaletteIndex = activePaletteIndex !== x11ColorPalettes.length - 1 ? activePaletteIndex + 1 : 0;
		const goToPaletteId = x11ColorPalettes.at(goToPaletteIndex).id;
		scrollToSelectedPalette(goToPaletteId);
	}

	function handleX11PaletteSelected(e: CustomEvent<{ paletteId: string }>) {
		const { paletteId } = e.detail;
		scrollToSelectedPalette(paletteId);
	}

	function scrollToSelectedPalette(goToPaletteId: string) {
		const goToPaletteIndex = x11PaletteMap[goToPaletteId];
		const scrollDistance = (goToPaletteIndex - activePaletteIndex) * carouselItemSize;
		activePaletteId = x11ColorPalettes.at(goToPaletteIndex).id;
		carouselElement.scrollTo(carouselElement.scrollLeft + scrollDistance, 0);
	}

	async function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			hideX11PalettesEventDispatcher('hideX11Palettes');
		}
		if (event.key === 'ArrowLeft') {
			scrollToPreviousPalette();
		}
		if (event.key === 'ArrowRight') {
			scrollToNextPalette();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	id="x11-palettes"
	style="background-color: var(--{paletteColor}-hover-bg-color); border: 1px solid var(--{paletteColor}-fg-color)"
>
	<div class="x11-controls">
		<div class="x11-swatches">
			<X11Swatches {activePaletteId} {x11ColorPalettes} on:x11PaletteSelected={handleX11PaletteSelected} />
		</div>
		<button
			type="button"
			class="btn-close"
			aria-label="Close"
			title="Close X11 Color Palettes"
			style="color: var(--{paletteColor}-fg-color)"
			on:click={() => hideX11PalettesEventDispatcher('hideX11Palettes')}
		>
			<Close />
		</button>
	</div>
	<div class="carousel-wrapper">
		<button
			type="button"
			class="btn-nav prev-page"
			aria-label="Previous Color Palette"
			title="Previous Color Palette"
			style="color: var(--{paletteColor}-fg-color)"
			on:click={() => scrollToPreviousPalette()}
		>
			<ChevronLeft />
		</button>
		<div class="carousel" bind:this={carouselElement}>
			{#each x11ColorPalettes as palette}
				<div id="x11-palette-{palette.id}" class="carousel-item">
					<Palette
						{palette}
						expanded={true}
						alwaysExpanded={true}
						displayPaletteName={true}
						x11Palette={true}
						columns={7}
						on:colorSelected
					/>
				</div>
			{/each}
		</div>
		<button
			type="button"
			class="btn-nav next-page"
			aria-label="Next Color Palette"
			title="Next Color Palette"
			style="color: var(--{paletteColor}-fg-color)"
			on:click={() => scrollToNextPalette()}
		>
			<ChevronRight />
		</button>
	</div>
</div>

<style lang="postcss">
	#x11-palettes {
		display: grid;
		grid:
			[controls-start] 'controls' 36px [controls-end]
			[carousel-start] 'carousel-wrapper' 118px [carousel-end]
			/ 100%;
		width: 371px;
		border-radius: 6px;
		margin: 0 auto;
		padding: 7px;
	}

	.x11-controls {
		display: grid;
		grid-area: controls;
		grid: '. swatches btn-close' 36px / 1fr 320px 1fr;
	}

	.x11-swatches {
		display: flex;
		grid-area: swatches;
		flex-flow: row nowrap;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.btn-close {
		grid-area: btn-close;
		place-self: start center;
		width: 14px;
		color: var(--black1);
		margin: 2px 0 0 0;
	}

	.btn-close:hover {
		color: var(--dark-gray1);
	}

	.carousel-wrapper {
		display: grid;
		grid-area: carousel-wrapper;
		grid: 'prev carousel next' 1fr / 1fr 320px 1fr;
		width: 100%;
	}

	.carousel {
		display: flex;
		align-items: flex-start;
		grid-area: carousel;
		place-self: end stretch;
		scroll-snap-type: x mandatory;
		overflow-x: scroll;
		overflow-y: hidden;
		/* Enable Safari touch scrolling physics */
		-webkit-overflow-scrolling: touch;
	}

	.carousel-item {
		flex: 0 1 320px;
		scroll-snap-align: center;
		scroll-snap-stop: always;
		margin: 0 auto;
	}

	.btn-nav {
		background-color: transparent;
		border: none;
		width: 12px;
		margin: 0 0 36px 0;
	}

	.prev-page {
		grid-area: prev;
		place-self: center start;
	}

	.next-page {
		grid-area: next;
		place-self: center end;
	}
</style>
