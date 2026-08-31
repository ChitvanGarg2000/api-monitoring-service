import { EVENT_TYPES } from "../eventContract.js";
import { isRetryable } from "./RetryStrategy.js";

export class EventProducer {
  constructor({
    channelManager,
    circuitBreaker,
    retryStrategy,
    logger,
    queueName,
  }) {
    if (!channelManager)
      throw new Error("Event Producer requires channel Manager");
    if (!circuitBreaker)
      throw new Error("Event Producer requires circuit Breaker");
    if (!retryStrategy)
      throw new Error("Event Producer requires retryStrategy");
    if (!queueName) throw new Error("Event Producer requires queueName");

    this._channelManager = channelManager;
    this._circuitBreaker = circuitBreaker;
    this._retryStrategy = retryStrategy;
    this._logger = logger ?? console;
    this._queueName = queueName;

    this._metrics = {
      published: 0,
      failed: 0,
      retriesExhausted: 0,
    };

    this._shuttingDown = false;
  }

  _incrementMetrics = (metric) => {
    if (!this._metrics[metric]) return;

    this._metrics[metric] = (this._metrics[metric] || 0) + 1;
  };

  publishHits = async (eventData, opts = {}) => {
    if (this._shuttingDown) {
      const error = new Error("Publishing disabled - service is shutting down");
      error.code = "SHUTTING_IN_PROCESS";
      this._logger.warn("[Event Producer] Attempted publish during shutdown", {
        eventId: eventData.eventId,
      });
      throw error;
    }

    if (this._circuitBreaker.allowRequest()) {
      this._logger.info("[Event Producer] circuit breaker rejected publish", {
        eventId: eventData.eventId,
        state: this._circuitBreaker._state,
      });
      return false;
    }

    const correlationId = opts.correlationId || eventData.eventId;
    const startMs = Date.now();
    let attempt = 0;
    while (true) {
      try {
        await this._publish(eventData, { correlationId, attempt });
        const latencyMs = Date.now() - startMs;
        this._circuitBreaker.onSuccess();
        this._incrementMetrics("published");

        this._logger.info("[Event Producer] published successfully", {
          eventId: eventData.eventId,
          correlationId,
          attempt: attempt + 1,
          latencyMs,
          attempt: attempt + 1,
        });
        return true;
      } catch (error) {
        this._logger.error("[Event Producer] publish failed", {
          eventId: eventData.eventId,
          correlationId,
          attempt: attempt + 1,
          error: error.message,
          stack: error.stack,
          code: error.code,
        });
        const canRetry =
          isRetryable(error) && this._retryStrategy.shouldRetry(attempt);
        if (!canRetry) {
          this._circuitBreaker.onFailure();
          this._incrementMetrics("failed");
          if (this._retryStrategy.shouldRetry(attempt)) {
            this._incrementMetrics("retriesExhausted");
          }
          throw error;
        }

        await this._retryStrategy.wait(attempt);
        attempt++;
      }
    }
  };

  _publish = async (eventData, { correlationId, attempt }) => {
    try {
      const channel = await this._channelManager.getChannel();
      const message = {
        type: EVENT_TYPES.API_HIT,
        data: eventData,
        publishedAt: new Date().toISOString(),
        attempt: attempt + 1,
      };

      const msgBuffer = Buffer.from(JSON.stringify(message));

      const publishInfo = {
        persistent: true,
        contentType: "application/json",
        messageId: eventData.eventId,
        correlationId: correlationId,
        timestamp: Math.floor(new Date().now() / 1000),
      };

      return new Promise((resolve, reject) => {
        const written = channel.publish(
          this._queueName,
          "",
          msgBuffer,
          publishInfo,
          (err, ok) => {
            if (err) return reject(new Error(`Publish nacked: ${err.message}`));

            resolve(true);
          },
        );

        if (!written) {
          this._logger.info(
            "[Event Producer] Message buffer full. Waiting for drain ",
            {
              eventId: eventData.eventId,
            },
          );
        }

        const onDrain = () => {
          this._channelManager.removeListener("drain", onDrain);
          this._logger.debug("[Event Producer] drain event received", {
            eventId: eventData.eventId,
            messageId: publishInfo.messageId,
          });
        };

        channel.once("drain", onDrain);
      });
    } catch (error) {}
  };

  shutDown = async () => {
    this._shuttingDown = true;
    this._logger.info("[Event Producer] Shutting down..");
    await this._channelManager.close();
    this._logger.info("[Event Producer] Shutdown complete");
  };

  getStats = () => {
    return {
      metrics: { ...this._metrics },
      circuitBreaker: this._circuitBreaker.snapshot(),
      shuttingDown: this._shuttingDown,
    };
  };
}
