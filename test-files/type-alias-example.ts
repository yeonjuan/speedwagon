// Duplicate: same shape, same order
type UserA = { id: number; name: string };
type UserB = { name: string; id: number };

// Duplicate: same union, different order
type DirectionA = "left" | "right" | "up" | "down";
type DirectionB = "up" | "down" | "left" | "right";

// Duplicate: same intersection, different order
type AdminA = User & Authenticated & Timestamped;
type AdminB = Authenticated & User & Timestamped;

// Not duplicate: structurally different
type Point2D = { x: number; y: number };
type Point3D = { x: number; y: number; z: number };

// Duplicate: same generic reference
type IdsA = Array<number>;
type IdsB = Array<number>;

// Duplicate: same conditional type
type NonNullableA = string extends null | undefined ? never : string;
type NonNullableB = string extends null | undefined ? never : string;
