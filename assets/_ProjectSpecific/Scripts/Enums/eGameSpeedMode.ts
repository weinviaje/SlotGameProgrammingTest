import { Enum } from 'cc';

export enum eGameSpeedMode {
    NORMAL,
    SPEED,
    TURBO
}

// Registers your plain TypeScript enum into Cocos Creator's system registry
Enum(eGameSpeedMode);