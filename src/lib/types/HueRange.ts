import type { ComponentColor } from '.';

export interface HueRange {
	hueStart: number;
	hueEnd: number;
	name: string;
	componentColor: ComponentColor;
}
