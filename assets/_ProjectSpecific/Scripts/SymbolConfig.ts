import { _decorator, SpriteFrame, CCInteger } from 'cc';
const { ccclass, property } = _decorator;



@ccclass('SymbolDataEntry')
export class SymbolDataEntry {

    @property({ type: CCInteger })
    public id: number = 0;

    @property
    public spritePath: string = "";

}


@ccclass('SymbolConfig')
export class SymbolConfig {

    @property([SymbolDataEntry])
    public symbolList: SymbolDataEntry[] = [];

}

