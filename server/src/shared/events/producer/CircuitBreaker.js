const CircuitState = Object.freeze({
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN',
});


export default class CircuitBreaker{
    constructor(opts={}){
        this.failureThreshold = opts.failureThreshold || 5;
        this.cooldownMs = opts.cooldownMs || 3000;
        this.halfOpenMaxAttempts = opts.halfOpenMaxAttempts || 3;
        this.logger = opts.logger ?? console;

        this._state = CircuitState.CLOSED
        this._failures = 0
        this._lastFailureTime = null
        this._halfOpenAttempts = 0
        this._halfOpenSuccess = 0
    }

    _coolDownPeriodElapsed(){
        return Date.now() - this._lastFailureTime >= this.cooldownMs;
    }

    _transitionTo(newState){
        const previousState = this._state;
        this._state = newState;

        if(newState === CircuitState.HALF_OPEN){
            this._halfOpenAttempts = 0;
            this._halfOpenSuccess = 0;
            this.logger.info(`[CircuitBreaker] Transitioned from ${previousState} to ${newState}`);
        }
    }

    _openCircuit(){
        this._lastFailureTime = Date.now();
        this._transitionTo(CircuitState.OPEN);
        this.logger.error('[CircuitBreaker] Circuit opened', {
            failures: this._failures,
            cooldownMs: this.cooldownMs
        });
    }

    _attemptHalfOpen(){
        this._transitionTo(CircuitState.HALF_OPEN);
    }

    _reset(){
        this._failures = 0;
        this._lastFailureTime = null;
        this._halfOpenAttempts = 0;
        this._halfOpenSuccess = 0;
        this._state = CircuitState.CLOSED
    }

    shouldAllowRequest(){
        if(this._state === CircuitState.OPEN){
            if(this._coolDownPeriodElapsed()){
                this._attemptHalfOpen();
                return true;
            }
            return false;
        }
        return true;
    }

    get state(){
        if(this._state === CircuitState.OPEN && this._coolDownPeriodElapsed()){
            this._transitionTo(CircuitState.HALF_OPEN);
        }
        return this._state
    }
    
    allowedRequest(){
        if(this._state === CircuitState.CLOSED){
            return true
        }

        if(this._state === CircuitState.HALF_OPEN){
            if(this._halfOpenAttempts < this.halfOpenMaxAttempts){
                this._halfOpenAttempts++;
                return true;
            }
            return false;
        }

        return false
            
    }

    onSuccess(){
        if(this._state === CircuitState.HALF_OPEN){
            this._halfOpenSuccess++;
            if(this._halfOpenSuccess >= this.halfOpenMaxAttempts){
                this._reset();
                this.logger.info('[CircuitBreaker] Circuit reset after successful half-open attempts')
            }
            return
        }
        if(this._failures > 0){
            this._failures--;
        }
    }

    onFailure(){
        if(this._state === CircuitState.HALF_OPEN ){
            this.logger.info('[CircuitBreaker] Failure in half-open state. Opening circuit.')
            this._openCircuit()
            return;
        }

        this._failures++;

        if(this._failures >= this.failureThreshold){
            this._openCircuit()
            return;
        }
    }

    snapshot(){
        return {
            state: this._state,
            failures: this._failures,
            lastFailureTime: this._lastFailureTime,
            halfOpenAttempts: this._halfOpenAttempts,
            halfOpenSuccess: this._halfOpenSuccess
        }
    }
        

}