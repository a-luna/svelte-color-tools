import type {
	ColorPalette,
	ColorPalleteFromFile,
	Result,
	ThemeColor,
	ThemeColorShallowCopy,
	UserThemeFromFile,
	UserThemeImported,
} from '$lib/types';
import { capitalize, slugify } from '$lib/util';
import { ColorParser } from './parser';

export const CAMEL_CASE_REGEX = /^[a-z](?=.*[A-Z])[A-Za-z]*[^[-`]$/;
export const PROP_NAME_REGEX = /^[a-z]+$|^[a-z](?=.*[A-Z])[A-Za-z]*[^[-`]$/;
export const CSS_VAR_NAME_REGEX = /^--[\w-]*$/;

export const getWordsFromCamelCase = (input: string): string[] => {
	if (input) {
		let start = 0;
		let words = [];
		words = Array.from({ length: input.length }, (_, i) => input.charCodeAt(i))
			.map((n, i) => ({ isUpper: n < 97, index: i }))
			.filter((x) => x.isUpper)
			.map((x) => x.index)
			.map((boundary) => {
				const word = input.slice(start, boundary);
				start = boundary;
				return word;
			});
		words.push(input.slice(start, input.length));
		return words.filter((word) => word !== '');
	}
};

export function getWordsFromCssVariableName(input: string): string[] {
	if (CSS_VAR_NAME_REGEX.test(input)) {
		return input.slice(2).split('-');
	}
}

export function convertPropNameToDisplayName(propName: string): string {
	if (!propName || !PROP_NAME_REGEX.test(propName)) {
		return '';
	}
	const words = getWordsFromCamelCase(propName);
	if (words) {
		return words.map((w) => capitalize(w)).join(' ');
	}
}

export function convertPropNameToCssVarName(userTheme: UserThemeImported, propName: string): string {
	if (!propName || !PROP_NAME_REGEX.test(propName)) {
		return '';
	}
	const words = getWordsFromCamelCase(propName);
	if (words) {
		const cssVarName = `${words.map((w) => w.toLowerCase()).join('-')}`;
		if (userTheme.usesPrefix && `--${cssVarName}`.indexOf(`${userTheme.themePrefix}-`) === 0) {
			return `--${cssVarName}`.replace(`${userTheme.themePrefix}-`, '');
		}
		return cssVarName;
	}
}

export function convertCssVarNameToPropName(userTheme: UserThemeImported, cssVarName: string): string {
	if (!cssVarName || !CSS_VAR_NAME_REGEX.test(cssVarName)) {
		return '';
	}
	if (userTheme.usesPrefix) {
		cssVarName = cssVarName.replace(userTheme.themePrefix, '-');
	}
	const words = getWordsFromCssVariableName(cssVarName);
	if (words) {
		return `${words[0]}${words
			.slice(1)
			.map((w) => capitalize(w))
			.join('')}`;
	}
}

export function convertCssVarNameToDisplayName(userTheme: UserThemeImported, cssVarName: string): string {
	if (!cssVarName || !CSS_VAR_NAME_REGEX.test(cssVarName)) {
		return '';
	}
	if (userTheme.usesPrefix) {
		cssVarName = cssVarName.replace(userTheme.themePrefix, '-');
	}
	const words = getWordsFromCssVariableName(cssVarName);
	if (words) {
		return `${capitalize(words[0])} ${words
			.slice(1)
			.map((w) => capitalize(w))
			.join(' ')}`;
	}
}

export function convertDisplayNameToCssVarName(userTheme: UserThemeImported, displayName: string): string {
	if (!displayName) {
		return '';
	}
	const words = displayName.split(' ');
	if (words) {
		const cssVarName = `${words.map((w) => w.toLowerCase()).join('-')}`;
		if (userTheme.usesPrefix && `--${cssVarName}`.indexOf(`${userTheme.themePrefix}-`) === 0) {
			return `--${cssVarName}`.replace(`${userTheme.themePrefix}-`, '');
		}
		return cssVarName;
	}
}

export function convertDisplayNameToPropName(displayName: string): string {
	if (!displayName) {
		return '';
	}
	const words = displayName.split(' ');
	if (words) {
		return `${words[0].toLowerCase()}${words
			.slice(1)
			.map((w) => capitalize(w))
			.join('')}`;
	}
}

export const getCssValueForColor = (color: ThemeColor, colorFormat: 'hex' | 'rgb' | 'hsl'): string =>
	['currentcolor', 'inherit'].includes(color.value)
		? color.value
		: colorFormat === 'hsl'
		? color.color.hasAlpha
			? color.color.hslaString
			: color.color.hslString
		: colorFormat === 'rgb'
		? color.color.hasAlpha
			? color.color.rgbaString
			: color.color.rgbString
		: color.color.hasAlpha
		? color.color.hexAlpha
		: color.color.hex;

export function importUserThemeFromFile(theme: UserThemeFromFile): Result<UserThemeImported> {
	const palettes = [];
	for (const palette of theme.palettes) {
		const result = importColorPalette(palette);
		if (result.success) {
			palettes.push(result.value);
		} else {
			return { success: false, error: result.error };
		}
	}
	return { success: true, value: { ...theme, palettes } };
}

function importColorPalette(palette: ColorPalleteFromFile): Result<ColorPalette> {
	const colors = [];
	for (const color of palette.colors) {
		const result = ColorParser.parse(color.value);
		if (result.success) {
			colors.push({ ...color, color: { ...result.value, name: color.displayName }, isSelected: false });
		} else {
			return { success: false, error: Error(`Unable to parse "${color.value}" as a valid CSS color value`) };
		}
	}
	return { success: true, value: { ...palette, colors } };
}

export function exportUserThemeToFile(userTheme: UserThemeImported): UserThemeFromFile {
	const palettes = userTheme.palettes.map(({ id, propName, displayName, colors, componentColor }) => ({
		id,
		propName,
		displayName,
		componentColor,
		colors: colors.map((color) => ({
			propName: color.propName,
			cssVarName: color.cssVarName,
			displayName: color.displayName,
			value: getCssValueForColor(color, userTheme.colorFormat),
		})),
	}));
	return { ...userTheme, palettes };
}

export function copyThemeColor(color: ThemeColor): ThemeColorShallowCopy {
	const copy: ThemeColorShallowCopy = {};
	Object.entries(color).forEach(([prop, val]) => {
		if (prop !== 'color') {
			copy[prop] = val;
		}
	});
	return copy;
}

const getThemeColorCss = (userTheme: UserThemeImported, color: ThemeColor): string =>
	`${color.cssVarName}: ${getCssValueForColor(color, userTheme.colorFormat)}`;

export const convertThemePalettesToCss = (userTheme: UserThemeImported, withNewLines = false): string =>
	userTheme?.palettes
		.map((palette) => palette.colors.map((color) => getThemeColorCss(userTheme, color)))
		.flat()
		.join(withNewLines ? '\n;' : '; ');

export function downloadUserThemeJson(userTheme: UserThemeImported): void {
	userTheme.modifiedAt = new Date().toISOString();
	const filename = `${slugify(userTheme.themeName)}.json`;
	const blob = new Blob([JSON.stringify(exportUserThemeToFile(userTheme))], { type: 'text/json' });
	const link = document.createElement('a');
	link.download = filename;
	link.href = window.URL.createObjectURL(blob);
	link.dataset.downloadurl = `text/json:${link.download}:${link.href}`;

	link.dispatchEvent(
		new MouseEvent('click', {
			view: window,
			bubbles: true,
			cancelable: true,
		}),
	);
	link.remove();
}
