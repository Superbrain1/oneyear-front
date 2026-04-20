function readEnv(name, fallback = '') {
  if (typeof process !== 'undefined' && process.env && Object.prototype.hasOwnProperty.call(process.env, name)) {
    return process.env[name] || fallback;
  }
  return fallback;
}

const reportEndpoint = readEnv('VUE_APP_ERROR_REPORT_URL', '');
const isEnabled = readEnv('VUE_APP_ENABLE_ERROR_REPORTING', 'false') === 'true';

function serializeError(error) {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: typeof error === 'string' ? error : JSON.stringify(error)
  };
}

export function reportClientError(payload) {
  const body = {
    app: 'oneyear-fronte',
    env: readEnv('NODE_ENV', 'development'),
    occurredAt: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    ...payload
  };

  console.error('[monitoring] frontend error', body);

  if (!isEnabled || !reportEndpoint || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return;
  }

  try {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    navigator.sendBeacon(reportEndpoint, blob);
  } catch (error) {
    console.error('[monitoring] frontend beacon failed', error);
  }
}

export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('error', (event) => {
    reportClientError({
      channel: 'window.error',
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      error: serializeError(event.error)
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportClientError({
      channel: 'window.unhandledrejection',
      error: serializeError(event.reason)
    });
  });
}
