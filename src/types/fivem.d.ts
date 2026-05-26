declare const exports: (...args: unknown[]) => void;
declare function on(eventName: string, handler: (...args: unknown[]) => void): void;
declare function emitNet(eventName: string, target: number, ...args: unknown[]): void;
declare function TriggerEvent(eventName: string, ...args: unknown[]): void;
declare function GetConvar(name: string, defaultValue: string): string;
declare function GetCurrentResourceName(): string;

