import { Input, InputFlags } from "./Input";
import type { PointLike } from "./PointLike";

////////////////////////////////////////
// PointSetEditor

export interface PointSet {
    readonly points: readonly PointLike[];
    get(x: number, y: number): number;
    add(x: number, y: number): number;
    set(index: number, x: number, y: number): void;
    remove(index: number): void;
}

export class PointSetEditor {
    constructor(tapRegion: HTMLElement, readonly pointSet: PointSet, onEdit?: () => void, onCommit?: () => void) {
        this.input = new Input(
            tapRegion,
            at => {
                const ctrl = this.input.flags & InputFlags.Control;
                const index = pointSet.get(at.x, at.y);
                if (ctrl && index > -1) {
                    pointSet.remove(index);
                    onEdit?.();
                    return;
                }
                const p = pointSet.points[this._curIndex = index]
                    || ctrl && pointSet.points[this._curIndex = pointSet.add(at.x, at.y)]
                    || undefined;
                if (!p) return;
                onEdit?.();
                return { x: p.x, y: p.y };
            },
            p => {
                pointSet.set(this._curIndex, p.x, p.y);
                onEdit?.();
            },
            () => { this._curIndex = -1; onCommit?.(); }
        );
    }
    private readonly input: Input;
    private _curIndex = -1;
}
