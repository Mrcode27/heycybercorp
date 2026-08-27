/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as audit from "../audit.js";
import type * as catalog from "../catalog.js";
import type * as certificates from "../certificates.js";
import type * as courses from "../courses.js";
import type * as email from "../email.js";
import type * as entitlements from "../entitlements.js";
import type * as freeVideos from "../freeVideos.js";
import type * as http from "../http.js";
import type * as lessons from "../lessons.js";
import type * as lib_audit from "../lib/audit.js";
import type * as messages from "../messages.js";
import type * as orders from "../orders.js";
import type * as packages from "../packages.js";
import type * as progress from "../progress.js";
import type * as settings from "../settings.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  audit: typeof audit;
  catalog: typeof catalog;
  certificates: typeof certificates;
  courses: typeof courses;
  email: typeof email;
  entitlements: typeof entitlements;
  freeVideos: typeof freeVideos;
  http: typeof http;
  lessons: typeof lessons;
  "lib/audit": typeof lib_audit;
  messages: typeof messages;
  orders: typeof orders;
  packages: typeof packages;
  progress: typeof progress;
  settings: typeof settings;
  stripe: typeof stripe;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
