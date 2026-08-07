import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import {
  SentrySampler,
  SentrySpanProcessor,
  SentryPropagator,
  SentryAsyncLocalStorageContextManager,
} from '@sentry/opentelemetry';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

// 1) Sentry primeiro — mas mandando ELE NÃO montar o OTel (quem monta somos nós)
const sentryClient = Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: 'trace',
  skipOpenTelemetrySetup: true,
});

// 2) O NOSSO OpenTelemetry, com o Sentry plugado dentro
const sdk = new NodeSDK({
  serviceName: 'todo-api',
  sampler: sentryClient ? new SentrySampler(sentryClient) : undefined,
  spanProcessors: [
    new SentrySpanProcessor(), // → manda spans pro Sentry
    new BatchSpanProcessor(new OTLPTraceExporter()),
  ],
  textMapPropagator: new SentryPropagator(),
  contextManager: new SentryAsyncLocalStorageContextManager(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // o fs é escandalosamente barulhento (span pra cada leitura de arquivo) — desliga
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

// 3) Confirma que Sentry e OTel estão em sincronia (loga aviso se algo tá torto)
Sentry.validateOpenTelemetrySetup();
