import type { PointLike } from "./PointLike";

////////////////////////////////////////
// Input

export enum InputFlags {
    None = 0,
    Control = 1,
    Shift = 2,
    Alt = 4
}

export class Input {
    constructor(
        private readonly tapRegion: HTMLElement,
        private readonly getDragPoint: (at: PointLike) => (PointLike | undefined),
        private readonly dragged: (point: PointLike) => void,
        private readonly stopDrag: () => void,
        private readonly hover?: (point: PointLike) => void,
        private readonly flagChanged?: (flags: InputFlags) => void
    ) {
        this.tapRegion.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.tapRegion.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mouseup", this.onMouseUp.bind(this));
        document.addEventListener("keydown", this.onKeyChanged.bind(this));
        document.addEventListener("keyup", this.onKeyChanged.bind(this));
    }

    private _dragPoint: PointLike | undefined;
    private _mouseDownPos: PointLike = { x: 0, y: 0 };
    private _pos = { x: 0, y: 0 };
    private _flags = InputFlags.None;

    public get flags(): InputFlags { return this._flags; }

    private toLocalPos(ev: MouseEvent, out?: { x: number; y: number; }): PointLike {
        const r = this.tapRegion.getBoundingClientRect();
        const x = ev.clientX - r.x, y = ev.clientY - r.y;
        if (out) out.x = x, out.y = y;
        else out = { x, y };
        return out;
    }

    private onMouseDown(ev: MouseEvent): void {
        this._mouseDownPos = this.toLocalPos(ev);
        this._dragPoint = this.getDragPoint(this._mouseDownPos);
    }
    private onMouseMove(ev: MouseEvent): void {
        if (!this._dragPoint || !this._mouseDownPos) return;
        const pos = this.toLocalPos(ev);
        this.hover?.(pos);
        this.dragged({
            x: this._dragPoint.x + pos.x - this._mouseDownPos.x,
            y: this._dragPoint.y + pos.y - this._mouseDownPos.y
        });
    }
    private onMouseUp(): void {
        if (!this._dragPoint) return;
        this._dragPoint = undefined;
        this.stopDrag();
    }
    private onKeyChanged(ev: KeyboardEvent): void {
        const flags = this.getFlagsFromEvent(ev);
        const changed = flags != this.flags;
        this._flags = flags;
        if (changed) this.flagChanged?.(flags);
    }
    private getFlagsFromEvent(ev: KeyboardEvent): InputFlags {
        let flags = InputFlags.None;
        if (ev.ctrlKey) flags |= InputFlags.Control;
        if (ev.shiftKey) flags |= InputFlags.Shift;
        if (ev.altKey) flags |= InputFlags.Alt;
        return flags;
    }
}
