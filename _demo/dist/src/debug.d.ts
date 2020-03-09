/**
 * Note that the debug namespace is only exported in "debug" builds.
 * In production builds, this namespace is not included.
 *
 * @namespace debug
 */
/**
 * Asserts that some condition is true. If it is not, an error is logged and
 * the debugger will break.
 *
 * @memberof debug
 * @param bool The condition to ensure is true.
 * @param message The message to display if the first param is not true.
 * @param data Extra data to log.
 */
export declare function ASSERT(bool: boolean, message: string, data?: any): void;
/**
 * Validates that some condition is true. if it is not, a warning is logged.
 *
 * @memberof debug
 * @param bool The condition to ensure is true.
 * @param message The message to display if the first param is not true.
 * @param data Extra data to log.
 */
export declare function VALIDATE(bool: boolean, message: string, data?: any): void;
