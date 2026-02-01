"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpRequestsTotal = exports.httpRequestDurationMicroseconds = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
// Create a Registry which registers the metrics
const register = new prom_client_1.default.Registry();
// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'smartlaw-backend'
});
// Enable the collection of default metrics
prom_client_1.default.collectDefaultMetrics({ register });
// Create custom metrics
exports.httpRequestDurationMicroseconds = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
exports.httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'code']
});
// Register custom metrics
register.registerMetric(exports.httpRequestDurationMicroseconds);
register.registerMetric(exports.httpRequestsTotal);
exports.default = register;
