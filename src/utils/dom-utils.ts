/** Sets the textContent of an element by ID. Silently no-ops if element is not found. */
export function setEl(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
