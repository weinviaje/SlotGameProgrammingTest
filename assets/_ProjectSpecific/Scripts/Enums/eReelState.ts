import { Enum } from 'cc';

export enum eReelState {
    IDLE,
    SPINNING,
    STOPPING
}

// Registers your plain TypeScript enum into Cocos Creator's system registry
Enum(eReelState);