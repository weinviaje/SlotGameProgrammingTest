import { _decorator, Component, tween, Vec3, resources, SpriteFrame, log } from 'cc';
import { Symbol } from './Symbol';
import { ReelsManager } from './ReelsManager';
import { eReelState } from '../Enums/eReelState';

const { ccclass, property } = _decorator;

@ccclass('Reel')
export class Reel extends Component {

    // Drag your 5 symbol nodes here via the Inspector (ordered top to bottom)
    @property([Symbol])
    private symbols: Symbol[] = [];

    @property([Number])
    private targetYPos: number[] = [300, 150, 0, -150, -300];

    // The duration of a single row shift animation (in seconds)
    @property
    private stepDuration: number = 0.2;


    private _state: eReelState = eReelState.IDLE;

    @property([Number])
    private finalTargetIds: number[] = []; // Stores the 3 IDs this reel MUST stop on



    public Initialize(): void {

        if (!ReelsManager.instance) return;

        for (let i = 0; i < this.symbols.length; i++) {
            const symbolComponent = this.symbols[i];
            if (!symbolComponent) continue;

            const container = { id: 0, frame: null };
            // Instantly pulls the pre-cached texture asset out of memory
            if (ReelsManager.instance.GetRandomSymbolSprite(container)) {
                symbolComponent.SetData(container.id, container.frame!);
            }
        }

    }



    public async SpinReel(totalSteps: number, targetSymbolIds: number[]): Promise<void> {
        if (this._state !== eReelState.IDLE) return;

        this._state = eReelState.SPINNING;

        // Store the targets (e.g., [TopRowId, MiddleRowId, BottomRowId])
        this.finalTargetIds = [...targetSymbolIds];

        let currentStep = 0;

        while (true) {

            this.MoveLastSymbolOnTop();
            await this.MoveSymbolsDownOneStep();

            currentStep++;

            // When we are exactly 3 steps away from the end, start feeding the real results!
            if (totalSteps - currentStep === 3) {

                this._state = eReelState.STOPPING;

                await this.GenerateResults();
                break;

            }

            if (this._state === eReelState.SPINNING) {
                if (currentStep >= totalSteps) break;
            }
            else if (this._state === eReelState.STOPPING) {
                await this.GenerateResults();
                break;
            }
        }

        this._state = eReelState.IDLE;
    }



    public StopReel(): void {
        if (this._state !== eReelState.SPINNING) return;
        this._state = eReelState.STOPPING;

    }



    private MoveSymbolsDownOneStep(): Promise<void> {

        return new Promise((resolve) => {
            let completedTweens = 0;
            const totalSymbols = this.symbols.length;

            for (let i = 0; i < totalSymbols; i++) {
                const symbolComponent = this.symbols[i];
                if (!symbolComponent) continue; // Small safety check

                const node = symbolComponent.node;

                // Unity DOTween equivalent: node.DOMoveY(targetY, duration).OnComplete(...)
                tween(node)
                    .to(this.stepDuration,
                        { position: new Vec3(node.position.x, this.targetYPos[i], node.position.z) },
                        { easing: 'smooth' })
                    .call(() => {
                        completedTweens++;
                        // Once the final symbol finishes moving, resolve this step
                        if (completedTweens === totalSymbols) {
                            resolve();
                        }
                    })
                    .start();
            }
        });
    }



    private MoveLastSymbolOnTop(): void {

        const bottomSymbol = this.symbols.pop()!;

        const topPos = this.targetYPos[0];
        bottomSymbol.node.setPosition(new Vec3(bottomSymbol.node.position.x, topPos, bottomSymbol.node.position.z));

        this.symbols.unshift(bottomSymbol);
            
    }


    private async GenerateResults(): Promise<void> {

        const finalTargetIds: number[] = this.finalTargetIds;

        for (var i = finalTargetIds.length - 1; i >= 0; i--) {

            this.symbols[0].SetData(finalTargetIds[i], ReelsManager.instance.GetSpriteFrameById(finalTargetIds[i]));

            this.MoveLastSymbolOnTop();
            await this.MoveSymbolsDownOneStep();

        }

    }


    public async InstantResult(targetSymbolIds: number[]): Promise<void>  {

        this._state = eReelState.SPINNING;

        this.finalTargetIds = targetSymbolIds;

        // await a Cocos Frame to avoid instant shifting of state
        await this.waitForCocosFrame();

        for (var i = 0; i < this.finalTargetIds.length; i++) {

            // i + 1 for this.symbols because we need to start from the first visible symbol on top
            this.symbols[i + 1].SetData(this.finalTargetIds[i], ReelsManager.instance.GetSpriteFrameById(this.finalTargetIds[i]));

        }

        this._state = eReelState.IDLE;

    }


    private waitForCocosFrame(): Promise<void> {
        return new Promise(resolve => {
            this.scheduleOnce(() => resolve(), 0);
        });
    }


}

