import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Symbol')
export class Symbol extends Component {

    @property
    public id: number = 0;

    @property(Sprite)
    private spriteImage: Sprite | null = null;



    public SetData(id: number, spriteFrame : SpriteFrame) {

        this.id = id;

        if (this.spriteImage) {
            this.spriteImage.spriteFrame = spriteFrame;
        }

    }

}