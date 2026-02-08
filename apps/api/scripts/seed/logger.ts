/**
 * Structured Logger with Metrics
 * 
 * Provides timing, counting, and structured logging for seeder operations.
 */

export interface SeederMetrics {
    operation: string;
    startTime: number;
    endTime?: number;
    durationMs?: number;
    recordsProcessed?: number;
    recordsSkipped?: number;
    errors?: number;
    status: "running" | "success" | "failed";
}

class SeederLogger {
    private metrics: Map<string, SeederMetrics> = new Map();
    private globalStartTime: number = 0;

    /**
     * Initialize the seeder run
     */
    init(): void {
        this.globalStartTime = Date.now();
        this.metrics.clear();
        console.log("=".repeat(70));
        console.log("PRODUCTION SEEDER STARTED");
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log("=".repeat(70));
    }

    /**
     * Start tracking an operation
     */
    startOperation(operation: string): void {
        const metric: SeederMetrics = {
            operation,
            startTime: Date.now(),
            status: "running",
            recordsProcessed: 0,
            recordsSkipped: 0,
            errors: 0,
        };
        this.metrics.set(operation, metric);
        console.log(`\n[START] ${operation}`);
        console.log("-".repeat(50));
    }

    /**
     * Log progress within an operation
     */
    progress(operation: string, message: string, count?: number): void {
        const metric = this.metrics.get(operation);
        if (metric && count !== undefined) {
            metric.recordsProcessed = count;
        }
        console.log(`  [PROGRESS] ${message}`);
    }

    /**
     * Log info message
     */
    info(operation: string, message: string): void {
        console.log(`  [INFO] ${message}`);
    }

    /**
     * Log warning
     */
    warn(operation: string, message: string): void {
        console.log(`  [WARN] ${message}`);
    }

    /**
     * Log error
     */
    error(operation: string, message: string, error?: unknown): void {
        const metric = this.metrics.get(operation);
        if (metric) {
            metric.errors = (metric.errors ?? 0) + 1;
        }
        console.error(`  [ERROR] ${message}`);
        if (error instanceof Error) {
            console.error(`          ${error.message}`);
        }
    }

    /**
     * Complete an operation successfully
     */
    endOperation(
        operation: string,
        recordsProcessed: number,
        recordsSkipped = 0
    ): void {
        const metric = this.metrics.get(operation);
        if (!metric) return;

        metric.endTime = Date.now();
        metric.durationMs = metric.endTime - metric.startTime;
        metric.recordsProcessed = recordsProcessed;
        metric.recordsSkipped = recordsSkipped;
        metric.status = "success";

        console.log("-".repeat(50));
        console.log(`[COMPLETE] ${operation}`);
        console.log(`  Duration: ${this.formatDuration(metric.durationMs)}`);
        console.log(`  Records Processed: ${recordsProcessed}`);
        if (recordsSkipped > 0) {
            console.log(`  Records Skipped: ${recordsSkipped}`);
        }
        if (metric.errors && metric.errors > 0) {
            console.log(`  Errors: ${metric.errors}`);
        }
    }

    /**
     * Mark operation as failed
     */
    failOperation(operation: string, error: unknown): void {
        const metric = this.metrics.get(operation);
        if (!metric) return;

        metric.endTime = Date.now();
        metric.durationMs = metric.endTime - metric.startTime;
        metric.status = "failed";
        metric.errors = (metric.errors ?? 0) + 1;

        console.log("-".repeat(50));
        console.log(`[FAILED] ${operation}`);
        console.log(`  Duration: ${this.formatDuration(metric.durationMs)}`);
        if (error instanceof Error) {
            console.log(`  Error: ${error.message}`);
        }
    }

    /**
     * Print final summary
     */
    printSummary(): void {
        const totalDuration = Date.now() - this.globalStartTime;

        console.log("\n" + "=".repeat(70));
        console.log("SEEDER SUMMARY");
        console.log("=".repeat(70));
        console.log(`Total Duration: ${this.formatDuration(totalDuration)}`);
        console.log("");

        // Table header
        console.log(
            "Operation".padEnd(30) +
            "Status".padEnd(10) +
            "Records".padEnd(12) +
            "Duration".padEnd(15)
        );
        console.log("-".repeat(70));

        // Table rows
        for (const [, metric] of this.metrics) {
            const statusIcon =
                metric.status === "success"
                    ? "OK"
                    : metric.status === "failed"
                        ? "FAIL"
                        : "...";
            const records =
                metric.recordsProcessed !== undefined
                    ? String(metric.recordsProcessed)
                    : "-";
            const duration = metric.durationMs
                ? this.formatDuration(metric.durationMs)
                : "-";

            console.log(
                metric.operation.padEnd(30) +
                statusIcon.padEnd(10) +
                records.padEnd(12) +
                duration.padEnd(15)
            );
        }

        console.log("=".repeat(70));

        // Check for failures
        const failures = Array.from(this.metrics.values()).filter(
            (m) => m.status === "failed"
        );
        if (failures.length > 0) {
            console.log(`\nWARNING: ${failures.length} operation(s) failed.`);
        } else {
            console.log("\nAll operations completed successfully.");
        }
    }

    /**
     * Format milliseconds to human readable
     */
    private formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(1);
        return `${minutes}m ${seconds}s`;
    }

    /**
     * Get all metrics for programmatic access
     */
    getMetrics(): Map<string, SeederMetrics> {
        return this.metrics;
    }
}

export const logger = new SeederLogger();
