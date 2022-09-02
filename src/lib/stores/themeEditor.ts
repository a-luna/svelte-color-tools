import { createEmptyColorPalette } from '$lib/color';
import { defaultThemeEditorState } from '$lib/constants';
import type { CssColor, ThemeColor, ThemeEditorState, ThemeEditorStore } from '$lib/types';
import { writable } from 'svelte/store';

const getDefaultEditorState = (editorId: string): ThemeEditorState => ({ ...defaultThemeEditorState, editorId });

export function createThemeEditorStore(editorId: string): ThemeEditorStore {
	const { set, subscribe, update } = writable<ThemeEditorState>(getDefaultEditorState(editorId));

	function createNewPalette(state: ThemeEditorState): ThemeEditorState {
		state.userTheme.palettes = [
			...state.userTheme.palettes,
			createEmptyColorPalette(`palette ${state.userTheme.palettes.length + 1}`),
		];
		return state;
	}

	function deletePalette(paletteId: string, state: ThemeEditorState): ThemeEditorState {
		state.userTheme.palettes = [...state.userTheme.palettes.filter((p) => p.id !== paletteId)];
		if (state.selectedPaletteId === paletteId) {
			state.selectedPaletteId = '';
		}
		return state;
	}

	function changeSelectedPalette(paletteId: string, state: ThemeEditorState): ThemeEditorState {
		if (paletteId) {
			state.selectedPaletteId = paletteId;
			const selectedPalette = state.userTheme.palettes.find((p) => p.id === paletteId);
			if (selectedPalette) {
				selectedPalette.colors = [...selectedPalette.colors];
				state.userTheme.palettes = [...state.userTheme.palettes];
				selectedPalette.updated = true;
			}
		} else {
			state.selectedPaletteId = null;
		}
		return state;
	}

	function changeSelectedColor(color: ThemeColor, state: ThemeEditorState): ThemeEditorState {
		state.colorSelected = true;
		state.selectedColor = color;
		return state;
	}

	function updateThemeColor(color: CssColor, state: ThemeEditorState): ThemeEditorState {
		color.name = state.selectedColor.displayName;
		state.selectedColor.color = color;
		return updatePaletteColors(state);
	}

	function deselectColor(state: ThemeEditorState): ThemeEditorState {
		state.colorSelected = false;
		return state;
	}

	function addColorToPalette(newColor: ThemeColor, state: ThemeEditorState): ThemeEditorState {
		const selectedPalette = state.userTheme.palettes.find((p) => p.id === state.selectedPaletteId);
		selectedPalette.colors = [...selectedPalette.colors, newColor];
		return updatePaletteColors(state);
	}

	function updatePaletteColors(state: ThemeEditorState): ThemeEditorState {
		const selectedPalette = state.userTheme.palettes.find((p) => p.id === state.selectedPaletteId);
		state.userTheme.palettes = [...state.userTheme.palettes];
		selectedPalette.updated = true;
		return state;
	}

	function deleteColorFromPalette(color: ThemeColor, state: ThemeEditorState): ThemeEditorState {
		const selectedPalette = state.userTheme.palettes.find((p) => p.id === state.selectedPaletteId);
		const removeIndex = selectedPalette.colors.indexOf(color);
		selectedPalette.colors = [
			...selectedPalette.colors.slice(0, removeIndex),
			...selectedPalette.colors.slice(removeIndex + 1),
		];
		state.userTheme.palettes = [...state.userTheme.palettes];
		selectedPalette.updated = true;
		return state;
	}

	return {
		set,
		subscribe,
		createNewPalette: () => update((state) => createNewPalette(state)),
		deletePalette: (id: string) => update((state) => deletePalette(id, state)),
		changeSelectedPalette: (id: string) => update((state) => changeSelectedPalette(id, state)),
		changeSelectedColor: (color: ThemeColor) => update((state) => changeSelectedColor(color, state)),
		updateThemeColor: (color: CssColor) => update((state) => updateThemeColor(color, state)),
		deselectColor: () => update((state) => deselectColor(state)),
		addColorToPalette: (color: ThemeColor) => update((state) => addColorToPalette(color, state)),
		deleteColorFromPalette: (color: ThemeColor) => update((state) => deleteColorFromPalette(color, state)),
	};
}