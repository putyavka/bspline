import { Input } from "./Input";

////////////////////////////////////////
// Knots editor

export class KnotsEditor {
    constructor(
        tapRegion: HTMLElement,
        tapRadius: number,
        public knots: number[],
        onEdit: () => void
    ) {
        const width = tapRegion.clientWidth;
        const dx = tapRadius / width;
        this.input = new Input(
            tapRegion,
            at => {
                const knots = this.knots;
                const x = at.x / width;
                for (let i = 1; i < knots.length - 1; i++) {
                    if (Math.abs(knots[i] - x) < dx) {
                        this._curIndex = i;
                        return { x: knots[i] * width, y: 0 };
                    }
                }
            },
            p => {
                const knots = this.knots;
                const x = Math.max(0, Math.min(p.x / width, 1));
                for (let i = this._curIndex; i > 0 && x < knots[i]; i--)
                    knots[i] = x;
                for (let i = this._curIndex; i < knots.length && x > knots[i]; i++)
                    knots[i] = x;
                onEdit();
            },
            () => { this._curIndex = -1; }
        );
    }
    private readonly input: Input;
    private _curIndex = -1;
}
