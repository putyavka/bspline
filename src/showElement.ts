export function showElement(element: HTMLElement, show: boolean): void {
    element.style = "display: " + (show ? "inline-block" : "none");
}
