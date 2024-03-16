/**
 * This work by Justin Kunimune is marked with CC0 1.0 Universal.
 * To view a copy of this license, visit <https://creativecommons.org/publicdomain/zero/1.0>
 */
import {Tile, Vertex} from "../source/surface/surface.js";
import {Disc} from "../source/surface/disc.js";
import {Vector} from "../source/utilities/geometry.js";

const surface = new Disc(Math.sqrt(7)/2, 0);
surface.initialize();
const tiles = [
    new Tile(0, surface.фλ(new Vector(-Math.sqrt(3)/2, 0, 0)), surface),
    new Tile(1, surface.фλ(new Vector(0, -1/2, 0)), surface),
    new Tile(2, surface.фλ(new Vector(0, 0, 0)), surface),
    new Tile(3, surface.фλ(new Vector(0, 1/2, 0)), surface),
    new Tile(4, surface.фλ(new Vector(Math.sqrt(3)/2, 0, 0)), surface),
];
surface.populateWith(tiles);

describe("Tile", () => {
    describe("leftOf()", () => {
        test("left", () => {
            expect(tiles[2].leftOf(tiles[0])).toBe(tiles[1].leftOf(tiles[2]));
        });
        test("right", () => {
            expect(tiles[1].rightOf(tiles[0])).toBe(tiles[0].rightOf(tiles[2]));
        });
        test("external", () => {
            expect(tiles[0].leftOf(tiles[3])).toBe(tiles[3].rightOf(tiles[0]));
        });
    });
    describe("getArea()", () => {
        test("external", () => {
            expect(tiles[1].getArea()).toBeCloseTo(0.545415);
        });
    });
});

describe("Vertex", () => {
    const innerVertex = tiles[0].leftOf(tiles[1]);
    const outerVertex = tiles[0].rightOf(tiles[1]);
    const edge = innerVertex.neighbors.get(outerVertex);
    describe("pos", () => {
        test ("internal", () => {
            expect(innerVertex.pos).toEqual(new Vector(
                expect.closeTo(-Math.sqrt(3)/4),
                expect.closeTo(-1/4),
                expect.closeTo(0)));
        });
        test ("external", () => {
            expect(outerVertex.pos).toEqual(expect.objectContaining({
                x: expect.closeTo(-Math.sqrt(3)/2),
                y: expect.closeTo(-1),
                z: expect.closeTo(0),
            }));
        });
    });
    describe("acrossFrom()", () => {
        test("exists", () => {
            expect(innerVertex.acrossFrom(tiles[2])).toBe(edge);
        });
        test("does not exist", () => {
            expect(outerVertex.acrossFrom(null)).toBe(edge);
        });
    });
    test("widershinsOf()", () => {
        expect(innerVertex.widershinsOf(tiles[1])).toBe(tiles[2]);
    });
});

describe("Edge", () => {
    describe("short", () => {
        const edge = tiles[0].neighbors.get(tiles[2]);
        edge.setCoordinatesAndBounds();
        test("distance", () => {
            expect(edge.distance).toBeCloseTo(Math.sqrt(3)/2);
        });
        test("length", () => {
            expect(edge.length).toBeCloseTo(1/2);
        });
        test("leftBound", () => {
            expect(edge.leftBoundCartesian).toEqual([
                expect.objectContaining({x: expect.closeTo(-3*Math.sqrt(3)/8), y: expect.closeTo(-1/4 + Math.sqrt(3)/8*Math.tan(15/180*Math.PI))}),
                expect.objectContaining({x: expect.closeTo(-3*Math.sqrt(3)/8), y: expect.closeTo(1/4 - Math.sqrt(3)/8*Math.tan(15/180*Math.PI))}),
            ]);
        });
        test("rightBound", () => {
            expect(edge.rightBoundCartesian).toEqual([
                expect.objectContaining({x: expect.closeTo(-Math.sqrt(3)/4 + 1/4), y: expect.closeTo(0)}),
            ]);
        });
        test("bounds", () => {
            expect(edge.bounds).toEqual([
                {x: expect.closeTo(0.), y: expect.closeTo(0.)},
                {x: expect.closeTo(Math.sqrt(3)/8*Math.tan(15/180*Math.PI)), y: expect.closeTo(Math.sqrt(3)/8)},
                {x: expect.closeTo(1/2 - Math.sqrt(3)/8*Math.tan(15/180*Math.PI)), y: expect.closeTo(Math.sqrt(3)/8)},
                {x: expect.closeTo(1/2), y: expect.closeTo(0.)},
                {x: expect.closeTo(1/4), y: expect.closeTo(-1/4)},
            ]);
        });
        test("toEdgeCoords()", () => {
            expect(edge.toEdgeCoords(new Vector(-Math.sqrt(3)/4, 0, 0))).toEqual({
                x: expect.closeTo(1/4),
                y: expect.closeTo(0)
            });
        });
        test("fromEdgeCoords()", () => {
            expect(edge.fromEdgeCoords({x: 1/4, y: 0})).toEqual(expect.objectContaining({
                x: expect.closeTo(-Math.sqrt(3)/4),
                y: expect.closeTo(0),
                z: expect.closeTo(0),
            }));
        });
        describe("getPath()", () => {
            test("finer scale", () => {
                expect(() => edge.getPath(0.1)).not.toThrow();
            });
            test("coarsest scale", () => {
                expect(edge.getPath(Number.POSITIVE_INFINITY)).toEqual([
                    expect.objectContaining({ф: edge.vertex0.ф, λ: edge.vertex0.λ}),
                    expect.objectContaining({ф: edge.vertex1.ф, λ: edge.vertex1.λ}),
                ]);
            });
        });
    });
    describe("long", () => {
        const edge = tiles[1].neighbors.get(tiles[2]);
        edge.setCoordinatesAndBounds();
        test("distance", () => {
            expect(edge.distance).toBeCloseTo(1/2);
        });
        test("length", () => {
            expect(edge.length).toBeCloseTo(Math.sqrt(3)/2);
        });
        test("bounds", () => {
            expect(edge.bounds).toEqual([
                {x: expect.closeTo(0.), y: expect.closeTo(0.)},
                {x: expect.closeTo(1/4), y: expect.closeTo(1/4)},
                {x: expect.closeTo(Math.sqrt(3)/2 - 1/4), y: expect.closeTo(1/4)},
                {x: expect.closeTo(Math.sqrt(3)/2), y: expect.closeTo(0)},
                {x: expect.closeTo(Math.sqrt(3)/2 - Math.sqrt(3)/8), y: expect.closeTo(-3/8)},
                {x: expect.closeTo(Math.sqrt(3)/8), y: expect.closeTo(-3/8)},
            ]);
        });
        describe("getPath()", () => {
            test("finer scale", () => {
                expect(() => edge.getPath(0.1)).not.toThrow();
            });
            test("coarsest scale", () => {
                expect(edge.getPath(Number.POSITIVE_INFINITY)).toEqual([
                    expect.objectContaining({ф: edge.vertex0.ф, λ: edge.vertex0.λ}),
                    expect.objectContaining({ф: edge.vertex1.ф, λ: edge.vertex1.λ}),
                ]);
            });
            test("illegal scale", () => {
                expect(() => edge.getPath(0)).toThrow();
            });
        });
    });
});
