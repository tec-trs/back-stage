import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces';

const sdk = new NodeSDK({
  resource: new Resource({
    'service.name': 'back-stage-backend',
    'service.version': '0.1.0',
  }),
  traceExporter: new OTLPTraceExporter({ url: otlpEndpoint }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

function shutdown(): void {
  sdk
    .shutdown()
    .catch((error: unknown) => {
      console.error('Erro ao encerrar OpenTelemetry SDK', error);
    })
    .finally(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
