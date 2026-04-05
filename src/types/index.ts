/**
 * Core type definitions for the duplicate detector
 *
 * This module exports all fundamental interfaces and types
 * used throughout the two-phase analysis system.
 */

export type { Collector, CollectorFactory } from "./collector.js";
export type {
  GlobalContext,
  DetectorContext,
  ReportContext,
  Store,
  Position,
  Location,
  Maybe,
} from "./context.js";
export type { Detector, DetectorConfig } from "./detector.js";
export type { Report, DuplicateEntry } from "./report.js";
export type { Language } from "./language.js";
