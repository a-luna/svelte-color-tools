import type { CssColor } from '.';

export interface ThemeColor {
	color: CssColor;
	propName?: string;
	cssVarName?: string;
	displayName?: string;
	value?: string;
}

export type ThemeColorShallowCopy = Omit<ThemeColor, 'color'>;
