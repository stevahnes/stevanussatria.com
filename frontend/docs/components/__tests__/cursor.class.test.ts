import { describe, it, expect } from "vitest";
import { Cursor } from "../resume_builder/class";

describe("Cursor", () => {
  // ── Construction ────────────────────────────────────────────────────────────

  it("initialises x, y, and size from constructor arguments", () => {
    const c = new Cursor(10, 20, 12);
    expect(c.getXCoordinate()).toBe(10);
    expect(c.getYCoordinate()).toBe(20);
    expect(c.getSize()).toBe(12);
  });

  it("accepts zero values", () => {
    const c = new Cursor(0, 0, 0);
    expect(c.getXCoordinate()).toBe(0);
    expect(c.getYCoordinate()).toBe(0);
    expect(c.getSize()).toBe(0);
  });

  it("accepts negative values", () => {
    const c = new Cursor(-5, -10, -2);
    expect(c.getXCoordinate()).toBe(-5);
    expect(c.getYCoordinate()).toBe(-10);
    expect(c.getSize()).toBe(-2);
  });

  it("accepts floating-point values", () => {
    const c = new Cursor(1.5, 2.75, 11.5);
    expect(c.getXCoordinate()).toBe(1.5);
    expect(c.getYCoordinate()).toBe(2.75);
    expect(c.getSize()).toBe(11.5);
  });

  // ── Getters ─────────────────────────────────────────────────────────────────

  it("getXCoordinate returns current x", () => {
    const c = new Cursor(42, 0, 0);
    expect(c.getXCoordinate()).toBe(42);
  });

  it("getYCoordinate returns current y", () => {
    const c = new Cursor(0, 99, 0);
    expect(c.getYCoordinate()).toBe(99);
  });

  it("getSize returns current size", () => {
    const c = new Cursor(0, 0, 16);
    expect(c.getSize()).toBe(16);
  });

  // ── setXCoordinate ──────────────────────────────────────────────────────────

  it("setXCoordinate updates x", () => {
    const c = new Cursor(0, 0, 0);
    c.setXCoordinate(55);
    expect(c.getXCoordinate()).toBe(55);
  });

  it("setXCoordinate does not affect y or size", () => {
    const c = new Cursor(1, 2, 3);
    c.setXCoordinate(100);
    expect(c.getYCoordinate()).toBe(2);
    expect(c.getSize()).toBe(3);
  });

  it("setXCoordinate can set zero", () => {
    const c = new Cursor(10, 0, 0);
    c.setXCoordinate(0);
    expect(c.getXCoordinate()).toBe(0);
  });

  it("setXCoordinate overwrites a previous value", () => {
    const c = new Cursor(5, 0, 0);
    c.setXCoordinate(10);
    c.setXCoordinate(20);
    expect(c.getXCoordinate()).toBe(20);
  });

  // ── setYCoordinate ──────────────────────────────────────────────────────────

  it("setYCoordinate updates y", () => {
    const c = new Cursor(0, 0, 0);
    c.setYCoordinate(77);
    expect(c.getYCoordinate()).toBe(77);
  });

  it("setYCoordinate does not affect x or size", () => {
    const c = new Cursor(1, 2, 3);
    c.setYCoordinate(100);
    expect(c.getXCoordinate()).toBe(1);
    expect(c.getSize()).toBe(3);
  });

  it("setYCoordinate overwrites a previous value", () => {
    const c = new Cursor(0, 5, 0);
    c.setYCoordinate(10);
    c.setYCoordinate(30);
    expect(c.getYCoordinate()).toBe(30);
  });

  // ── incrementYCoordinate ────────────────────────────────────────────────────

  it("incrementYCoordinate adds to y", () => {
    const c = new Cursor(0, 10, 0);
    c.incrementYCoordinate(5);
    expect(c.getYCoordinate()).toBe(15);
  });

  it("incrementYCoordinate with zero leaves y unchanged", () => {
    const c = new Cursor(0, 10, 0);
    c.incrementYCoordinate(0);
    expect(c.getYCoordinate()).toBe(10);
  });

  it("incrementYCoordinate with negative value decrements y", () => {
    const c = new Cursor(0, 10, 0);
    c.incrementYCoordinate(-3);
    expect(c.getYCoordinate()).toBe(7);
  });

  it("incrementYCoordinate accumulates across multiple calls", () => {
    const c = new Cursor(0, 0, 0);
    c.incrementYCoordinate(5);
    c.incrementYCoordinate(5);
    c.incrementYCoordinate(5);
    expect(c.getYCoordinate()).toBe(15);
  });

  it("incrementYCoordinate does not affect x or size", () => {
    const c = new Cursor(7, 0, 14);
    c.incrementYCoordinate(10);
    expect(c.getXCoordinate()).toBe(7);
    expect(c.getSize()).toBe(14);
  });

  it("incrementYCoordinate works with floating-point increments", () => {
    const c = new Cursor(0, 1.5, 0);
    c.incrementYCoordinate(0.5);
    expect(c.getYCoordinate()).toBeCloseTo(2.0);
  });

  // ── setCoordinates ──────────────────────────────────────────────────────────

  it("setCoordinates updates both x and y", () => {
    const c = new Cursor(0, 0, 0);
    c.setCoordinates(30, 40);
    expect(c.getXCoordinate()).toBe(30);
    expect(c.getYCoordinate()).toBe(40);
  });

  it("setCoordinates does not affect size", () => {
    const c = new Cursor(0, 0, 12);
    c.setCoordinates(1, 2);
    expect(c.getSize()).toBe(12);
  });

  it("setCoordinates overwrites previous x and y", () => {
    const c = new Cursor(1, 2, 3);
    c.setCoordinates(100, 200);
    expect(c.getXCoordinate()).toBe(100);
    expect(c.getYCoordinate()).toBe(200);
  });

  it("setCoordinates with zero resets both axes", () => {
    const c = new Cursor(5, 10, 8);
    c.setCoordinates(0, 0);
    expect(c.getXCoordinate()).toBe(0);
    expect(c.getYCoordinate()).toBe(0);
  });

  // ── setSize ─────────────────────────────────────────────────────────────────

  it("setSize updates size", () => {
    const c = new Cursor(0, 0, 10);
    c.setSize(18);
    expect(c.getSize()).toBe(18);
  });

  it("setSize does not affect x or y", () => {
    const c = new Cursor(3, 4, 10);
    c.setSize(20);
    expect(c.getXCoordinate()).toBe(3);
    expect(c.getYCoordinate()).toBe(4);
  });

  it("setSize can set zero", () => {
    const c = new Cursor(0, 0, 10);
    c.setSize(0);
    expect(c.getSize()).toBe(0);
  });

  it("setSize overwrites previous size", () => {
    const c = new Cursor(0, 0, 10);
    c.setSize(14);
    c.setSize(22);
    expect(c.getSize()).toBe(22);
  });

  // ── Interaction sequences ────────────────────────────────────────────────────

  it("supports a typical PDF layout sequence", () => {
    const c = new Cursor(10, 20, 12);
    // Move to new section
    c.setCoordinates(10, 40);
    expect(c.getXCoordinate()).toBe(10);
    expect(c.getYCoordinate()).toBe(40);
    // Increase font size for heading
    c.setSize(16);
    expect(c.getSize()).toBe(16);
    // Advance past heading
    c.incrementYCoordinate(8);
    expect(c.getYCoordinate()).toBe(48);
    // Reset to body size and indent
    c.setSize(10);
    c.setXCoordinate(15);
    expect(c.getXCoordinate()).toBe(15);
    expect(c.getSize()).toBe(10);
    // Advance several lines
    c.incrementYCoordinate(5);
    c.incrementYCoordinate(5);
    expect(c.getYCoordinate()).toBe(58);
  });

  it("independent cursors do not share state", () => {
    const a = new Cursor(0, 0, 10);
    const b = new Cursor(0, 0, 10);
    a.setXCoordinate(99);
    a.incrementYCoordinate(50);
    a.setSize(24);
    expect(b.getXCoordinate()).toBe(0);
    expect(b.getYCoordinate()).toBe(0);
    expect(b.getSize()).toBe(10);
  });
});
