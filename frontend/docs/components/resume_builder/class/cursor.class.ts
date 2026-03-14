export class Cursor {
  private x: number;
  private y: number;
  private size: number;

  constructor(initX: number, initY: number, initSize: number) {
    this.x = initX;
    this.y = initY;
    this.size = initSize;
  }

  getXCoordinate(): number {
    return this.x;
  }

  getYCoordinate(): number {
    return this.y;
  }

  getSize(): number {
    return this.size;
  }

  setXCoordinate(newX: number): void {
    this.x = newX;
  }

  setYCoordinate(newY: number): void {
    this.y = newY;
  }

  incrementYCoordinate(incrementY: number): void {
    this.y += incrementY;
  }

  setCoordinates(newX: number, newY: number): void {
    this.setXCoordinate(newX);
    this.setYCoordinate(newY);
  }

  setSize(newFontSize: number): void {
    this.size = newFontSize;
  }
}
