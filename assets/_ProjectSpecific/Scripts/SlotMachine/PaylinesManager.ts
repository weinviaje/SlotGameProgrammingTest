import { _decorator, Component, Node, RichText, director } from 'cc';
import { GameEvents } from '../GameEvents';
import { ReelsManager } from './ReelsManager';
const { ccclass, property } = _decorator;

@ccclass('PaylinesManager')
export class PaylinesManager extends Component {

    @property([Node])
    private paylineNodes: Node[] = [];

    @property([RichText])
    private winAmount: RichText | null = null;



    protected onLoad() {

        director.on(GameEvents.ON_SEQUENCE_STOPPED, this.ShowWinnings, this);
        director.on(GameEvents.ON_SPIN_CLICKED, this.ResetValues, this);

    }


    protected onDestroy() {

        director.off(GameEvents.ON_SEQUENCE_STOPPED, this.ShowWinnings, this);
        director.off(GameEvents.ON_SPIN_CLICKED, this.ResetValues, this);

    }


    private ShowWinnings(): void {

        const spinResult = ReelsManager.instance.GetSpinResult;

        if (spinResult.totalWin != 0) {

            this.winAmount.string = `WIN: $${spinResult.totalWin}`;

            for (var i = 0; i < spinResult.winningPaylines.length; i++) {

                this.paylineNodes[spinResult.winningPaylines[i]].active = true;

            }

        }

    }


    private ResetValues() {

        this.winAmount.string = "";

        for (var i = 0; i < this.paylineNodes.length; i++) {

            this.paylineNodes[i].active = false;

        }

    }

}

