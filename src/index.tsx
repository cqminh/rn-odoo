/**
 * Minimal type declarations for fetch-related globals. React Native and DOM
 * environments provide these at runtime, but we declare local types to keep
 * TypeScript happy when DOM lib is not included in tsconfig.json.
 */
declare const fetch: (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string> | unknown;
    body?: string;
    signal?: unknown;
  }
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  headers: {
    forEach: (callback: (value: string, key: string) => void) => void;
    get: (name: string) => string | null;
  };
  json: () => Promise<unknown>;
}>;

declare class AbortController {
  signal: AbortSignal;
  abort(): void;
}

interface AbortSignal {
  aborted: boolean;
  addEventListener(
    event: string,
    callback: () => void,
    options?: { once?: boolean }
  ): void;
}

declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(handle: unknown): void;

type FetchInit = {
  method?: string;
  headers?: Record<string, string> | unknown;
  body?: string;
  signal?: AbortSignal;
};

/**
 * Interceptor for outgoing requests. Return modified request or undefined to proceed.
 */
export type RequestInterceptor = (
  url: string,
  init: FetchInit
) =>
  | { url: string; init: FetchInit }
  | void
  | Promise<{ url: string; init: FetchInit } | void>;

/**
 * Interceptor for incoming responses. Return modified result or undefined to proceed.
 */
export type ResponseInterceptor = (
  result: OdooResult<unknown>
) => OdooResult<unknown> | void | Promise<OdooResult<unknown> | void>;

/**
 * Event names supported by the Odoo emitter.
 */
export type OdooEvent = 'connect' | 'disconnect' | 'error';

/**
 * Callback signature for Odoo events.
 */
export type OdooEventCallback = (data?: unknown) => void;

/**
 * The interface for Odoo configuration.
 * It includes the host URL, database name, username, password, and session ID (sid).
 */
export interface OdooConfig {
  host: string;
  database?: string;
  username?: string;
  password?: string;
  sid?: string;
  /**
   * When true (default), the password is cleared from memory after a successful connect.
   * Set to false if you need to reconnect later without re-entering the password.
   */
  clearPasswordAfterConnect?: boolean;
  /**
   * Request timeout in milliseconds. Defaults to 30000 (30 seconds).
   * Set to 0 to disable the built-in timeout.
   */
  timeout?: number;
  /**
   * Optional retry configuration for failed requests.
   * @property count - Number of retry attempts after the initial failure.
   * @property delay - Delay in milliseconds between retries. Defaults to 0.
   */
  retry?: { count: number; delay?: number };
}

/**
 * Standard result wrapper for all Odoo API calls.
 */
export interface OdooResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: OdooError | string;
  sid?: string;
  message?: string;
}

/**
 * Error shape returned by Odoo JSON-RPC.
 */
export interface OdooError {
  message: string;
  code?: number;
  data?: {
    name?: string;
    debug?: string;
    message?: string;
    arguments?: unknown[];
  };
}

/**
 * Type of the raw response returned by Odoo API calls.
 */
interface OdooResponse<T = unknown> {
  result?: T;
  error?: OdooError;
}

/**
 * The interface for request parameters used in Odoo API calls.
 * It includes the model name, method name, and optional arguments and keyword arguments.
 */
export interface RequestParams {
  model: string;
  method: string;
  args?: unknown[];
  kwargs?: Record<string, unknown>;
}

/**
 * Parameters for search and search_read operations.
 */
export interface SearchParams {
  domain?: unknown[];
  offset?: number;
  limit?: number;
  order?: string;
  fields?: string[];
}

/**
 * Parameters for custom method calls.
 */
export interface CallMethodParams {
  args?: unknown[];
  kwargs?: Record<string, unknown>;
  /**
   * @deprecated Use kwargs instead. These fields are kept for backward compatibility
   * and will be merged into kwargs.
   */
  domain?: unknown[];
  /**
   * @deprecated Use kwargs instead.
   */
  offset?: number;
  /**
   * @deprecated Use kwargs instead.
   */
  limit?: number;
  /**
   * @deprecated Use kwargs instead.
   */
  order?: string;
  /**
   * @deprecated Use kwargs instead.
   */
  fields?: string[];
}

/**
 * Parameters for fields_get operation.
 */
export interface FieldsGetParams {
  fields?: string[];
  attributes?: string[];
}

/**
 * Parameters for read_group operation.
 */
export interface ReadGroupParams {
  domain?: unknown[];
  fields?: string[];
  groupby?: string[];
  offset?: number;
  limit?: number;
  orderby?: string;
  lazy?: boolean;
}

/**
 * Data returned after a successful connect.
 */
export interface ConnectData {
  uid: number;
  username: string;
  user_context: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * The Odoo class provides methods to interact with the Odoo API.
 * It allows you to connect to an Odoo instance, perform CRUD operations,
 * search for records, and manage sessions.
 */
class Odoo {
  host: string;
  database?: string;
  username?: string;
  password?: string;
  sid?: string;
  private context: Record<string, unknown> = {};
  private clearPasswordAfterConnect: boolean;
  private timeout: number;
  private retry: { count: number; delay: number };
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private eventListeners: Map<OdooEvent, Set<OdooEventCallback>> = new Map();

  constructor(config: OdooConfig) {
    this.host = config.host;
    this.database = config.database;
    this.username = config.username;
    this.password = config.password;
    this.sid = config.sid;
    this.clearPasswordAfterConnect = config.clearPasswordAfterConnect ?? true;
    this.timeout = config.timeout ?? 30000;
    this.retry = {
      count: config.retry?.count ?? 0,
      delay: config.retry?.delay ?? 0,
    };
  }

  /**
   * Registers a request interceptor. Returns an unsubscribe function.
   * @param interceptor Function to intercept/modify outgoing requests.
   * @returns A function to remove the interceptor.
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const idx = this.requestInterceptors.indexOf(interceptor);
      if (idx >= 0) this.requestInterceptors.splice(idx, 1);
    };
  }

  /**
   * Registers a response interceptor. Returns an unsubscribe function.
   * @param interceptor Function to intercept/modify incoming responses.
   * @returns A function to remove the interceptor.
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const idx = this.responseInterceptors.indexOf(interceptor);
      if (idx >= 0) this.responseInterceptors.splice(idx, 1);
    };
  }

  /**
   * Subscribes to an Odoo event.
   * @param event The event name.
   * @param callback The callback to invoke when the event fires.
   * @returns A function to unsubscribe.
   */
  on(event: OdooEvent, callback: OdooEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribes from an Odoo event.
   * @param event The event name.
   * @param callback The callback to remove.
   */
  off(event: OdooEvent, callback: OdooEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private _emit(event: OdooEvent, data?: unknown): void {
    this.eventListeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch {
        // ignore listener errors
      }
    });
  }

  /**
   * Retrieves the list of databases available on the Odoo server.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async getDatabases(): Promise<OdooResult<string[]>> {
    return this._rawRequest<string[]>('/web/database/list', {});
  }

  /**
   * Connects to the Odoo instance using the provided credentials.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async connect(): Promise<OdooResult<ConnectData>> {
    const result = await this._rawRequest<ConnectData>(
      '/web/session/authenticate',
      {
        db: this.database,
        login: this.username,
        password: this.password,
      }
    );

    if (result.success && result.data) {
      this.sid = this._setCookieToSessionID(
        result.headers?.['set-cookie'] ?? null
      );
      this.context = result.data.user_context ?? {};
      this.username = result.data.username;

      if (this.clearPasswordAfterConnect) {
        this.password = undefined;
      }

      this._emit('connect', result.data);
      return { ...result, sid: this.sid };
    }

    return result;
  }

  /**
   * Connects to the Odoo instance using the stored session ID.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async connectWithSid(): Promise<OdooResult<ConnectData>> {
    const result = await this._rawRequest<ConnectData>(
      '/web/session/get_session_info',
      {},
      {
        'X-Openerp-Session-Id': this.sid || '',
      }
    );

    if (result.success && result.data) {
      this.sid = this._setCookieToSessionID(
        result.headers?.['set-cookie'] ?? null
      );
      this.context = result.data.user_context ?? {};
      this.username = result.data.username;
      this._emit('connect', result.data);
    }

    return result;
  }

  /**
   * Returns the current user context merged with the default context.
   * @returns The current context object.
   */
  getContext(): Record<string, unknown> {
    return { ...this.context };
  }

  /**
   * Searches for records in the specified model based on the provided parameters.
   * @param model The name of the model to search in.
   * @param params The search parameters, including the domain.
   * @param context Optional context to be used in the search.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async search(
    model: string,
    params: SearchParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<number[]>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'search',
      args: [params.domain],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Reads records in the specified model by their IDs.
   * @param model The name of the model to read from.
   * @param ids The IDs of the records to read.
   * @param fields Optional list of field names to read.
   * @param context Optional context to be used in the read.
   * @returns A promise that resolves to the records' data or an error.
   */
  async read<T = Record<string, unknown>>(
    model: string,
    ids: number[],
    fields?: string[],
    context?: Record<string, unknown>
  ): Promise<OdooResult<T[]>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'read',
      args: fields ? [ids, fields] : [ids],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Disconnect the current session from the Odoo instance.
   * @returns A promise that resolves to an object containing the success status and message or error.
   */
  async disconnect(): Promise<OdooResult<null>> {
    const result = await this._rawRequest<null>('/web/session/destroy', {});

    if (result.success) {
      this.sid = undefined;
      this.context = {};
      this.username = undefined;
      this._emit('disconnect');
      return { ...result, message: 'Disconnect successfully' };
    }

    return result;
  }

  /**
   * Searches for records in the specified model and reads their data.
   * @param model The name of the model to search in.
   * @param params The search parameters, including the domain, offset, limit, order, and fields.
   * @param context Optional context to be used in the search.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async search_read<T = Record<string, unknown>>(
    model: string,
    params: SearchParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T[]>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'search_read',
      args: [],
      kwargs: {
        context: { ...this.context, ...context },
        domain: params.domain,
        offset: params.offset,
        limit: params.limit,
        order: params.order,
        fields: params.fields,
      },
    });
  }

  /**
   * Counts the number of records in the specified model that match the given domain.
   * @param model The name of the model to count records in.
   * @param domain The domain to filter the records.
   * @param context Optional context to be used in the count.
   * @returns A promise that resolves to the count of records matching the domain.
   */
  async search_count(
    model: string,
    domain: unknown[],
    context?: Record<string, unknown>
  ): Promise<OdooResult<number>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'search_count',
      args: [domain],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Retrieves metadata about fields of the specified model.
   * @param model The name of the model.
   * @param params Optional parameters to filter fields and attributes.
   * @param context Optional context.
   * @returns A promise that resolves to field metadata.
   */
  async fields_get<T = Record<string, unknown>>(
    model: string,
    params?: FieldsGetParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'fields_get',
      args: [params?.fields, params?.attributes],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Groups records in the specified model and returns aggregated data.
   * @param model The name of the model.
   * @param params The group by parameters.
   * @param context Optional context.
   * @returns A promise that resolves to grouped records.
   */
  async read_group<T = Record<string, unknown>>(
    model: string,
    params: ReadGroupParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T[]>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'read_group',
      args: [],
      kwargs: {
        context: { ...this.context, ...context },
        domain: params.domain,
        fields: params.fields,
        groupby: params.groupby,
        offset: params.offset,
        limit: params.limit,
        orderby: params.orderby,
        lazy: params.lazy,
      },
    });
  }

  /**
   * Creates a new record in the specified model with the provided parameters.
   * @param model The name of the model to create a record in.
   * @param params The parameters for the new record.
   * @param context Optional context to be used in the creation.
   * @returns A promise that resolves to the created record's data or an error.
   */
  async create<T = number>(
    model: string,
    params: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'create',
      args: [params],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Updates existing records in the specified model with the provided parameters.
   * @param model The name of the model to update records in.
   * @param ids The IDs of the records to update.
   * @param params The parameters to update the records with.
   * @param context Optional context to be used in the update.
   * @returns A promise that resolves to the updated records' data or an error.
   */
  async update(
    model: string,
    ids: number[],
    params: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<OdooResult<boolean>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'write',
      args: [ids, params],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Deletes records in the specified model by their IDs.
   * @param model The name of the model to delete records from.
   * @param ids The IDs of the records to delete.
   * @param context Optional context to be used in the deletion.
   * @returns A promise that resolves to the result of the deletion or an error.
   */
  async delete(
    model: string,
    ids: number[],
    context?: Record<string, unknown>
  ): Promise<OdooResult<boolean>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'unlink',
      args: [ids],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Calls a method on the specified model with the provided parameters.
   * @param model The name of the model to call the method on.
   * @param method The name of the method to call.
   * @param params The parameters for the method call, including args and kwargs.
   * @param context Optional context to be used in the method call.
   * @returns A promise that resolves to the result of the method call or an error.
   */
  async call_method<T = unknown>(
    model: string,
    method: string,
    params: CallMethodParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T>> {
    const legacyKwargs: Record<string, unknown> = {};
    if (params.domain !== undefined) legacyKwargs.domain = params.domain;
    if (params.offset !== undefined) legacyKwargs.offset = params.offset;
    if (params.limit !== undefined) legacyKwargs.limit = params.limit;
    if (params.order !== undefined) legacyKwargs.order = params.order;
    if (params.fields !== undefined) legacyKwargs.fields = params.fields;

    return this._request('/web/dataset/call_kw', {
      model,
      method: method,
      args: params.args || [],
      kwargs: {
        context: { ...this.context, ...context },
        ...legacyKwargs,
        ...params.kwargs,
      },
    });
  }

  /**
   * Makes a JSON-RPC request to the Odoo dataset endpoint.
   * @param path The API endpoint path.
   * @param params The request parameters.
   * @returns A promise that resolves to the response data or an error.
   */
  protected async _request<T = unknown>(
    path: string,
    params: RequestParams
  ): Promise<OdooResult<T>> {
    return this._fetch<T>(path, {
      jsonrpc: '2.0',
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      method: 'call',
      params,
    });
  }

  /**
   * Makes a raw JSON request to a non JSON-RPC endpoint.
   * @param path The API endpoint path.
   * @param body The raw request body.
   * @param extraHeaders Additional headers to include.
   * @returns A promise that resolves to the response data or an error.
   */
  protected async _rawRequest<T = unknown>(
    path: string,
    body: Record<string, unknown>,
    extraHeaders?: Record<string, string>
  ): Promise<OdooResult<T> & { headers?: Record<string, string> }> {
    const result = await this._fetch<T>(
      path,
      {
        jsonrpc: '2.0',
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        method: 'call',
        params: body,
      },
      extraHeaders
    );
    return result;
  }

  /**
   * Core fetch wrapper used by all outgoing requests.
   * Applies interceptors, timeout, retry logic, and unified error handling.
   */
  private async _fetch<T = unknown>(
    path: string,
    body: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<OdooResult<T> & { headers?: Record<string, string> }> {
    let lastError:
      | (OdooResult<T> & { headers?: Record<string, string> })
      | undefined;

    for (let attempt = 0; attempt <= this.retry.count; attempt++) {
      const result = await this._fetchOnce<T>(path, body, extraHeaders);

      if (result.success) {
        return result;
      }

      const isAbortError =
        typeof result.error === 'string' && /aborted/i.test(result.error);

      if (isAbortError || attempt === this.retry.count) {
        return result;
      }

      lastError = result;

      if (this.retry.delay > 0) {
        await this._sleep(this.retry.delay);
      }
    }

    return lastError!;
  }

  /**
   * Performs a single fetch attempt.
   */
  private async _fetchOnce<T = unknown>(
    path: string,
    body: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<OdooResult<T> & { headers?: Record<string, string> }> {
    let url = `${this.host}${path}`;
    let init: FetchInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Openerp-Session-Id': this.sid || '',
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    };

    for (const interceptor of this.requestInterceptors) {
      const modified = await interceptor(url, init);
      if (modified) {
        url = modified.url;
        init = modified.init;
      }
    }

    const controller = new AbortController();
    let timeoutId: unknown | undefined;

    if (this.timeout > 0) {
      timeoutId = setTimeout(() => controller.abort(), this.timeout);
    }

    if (init.signal) {
      const userSignal = init.signal;
      if (userSignal.aborted) {
        controller.abort();
      } else {
        userSignal.addEventListener('abort', () => controller.abort(), {
          once: true,
        });
      }
    }
    init.signal = controller.signal;

    try {
      const response = await fetch(url, init);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      const responseHeaders: Record<string, string> = {};
      if (typeof response.headers?.forEach === 'function') {
        response.headers.forEach((value: string, key: string) => {
          responseHeaders[key] = value;
        });
      } else if (typeof response.headers?.get === 'function') {
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          responseHeaders['set-cookie'] = setCookie;
        }
      } else if (response.headers) {
        Object.assign(responseHeaders, response.headers);
      }

      if (!response.ok) {
        const errorResult: OdooResult<T> & {
          headers?: Record<string, string>;
        } = {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          headers: responseHeaders,
        };
        this._emit('error', errorResult.error);
        return errorResult;
      }

      const responseJson = (await response.json()) as OdooResponse<T>;
      if (responseJson.error) {
        const errorResult: OdooResult<T> & {
          headers?: Record<string, string>;
        } = {
          success: false,
          error: responseJson.error,
          headers: responseHeaders,
        };
        this._emit('error', responseJson.error);
        return errorResult;
      }

      let result: OdooResult<T> & { headers?: Record<string, string> } = {
        success: true,
        data: responseJson.result,
        headers: responseHeaders,
      };

      for (const interceptor of this.responseInterceptors) {
        const modified = await interceptor(result);
        if (modified) {
          result = modified as OdooResult<T> & {
            headers?: Record<string, string>;
          };
        }
      }

      return result;
    } catch (error) {
      const errorResult: OdooResult<T> & { headers?: Record<string, string> } =
        {
          success: false,
          error: this._formatError(error),
        };
      this._emit('error', errorResult.error);
      return errorResult;
    }
  }

  /**
   * Waits for the specified number of milliseconds.
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extracts the session ID from the 'set-cookie' header.
   * @param setCookie The 'set-cookie' header value.
   * @returns The session ID if found, otherwise an empty string.
   */
  private _setCookieToSessionID(setCookie: string | null): string {
    if (setCookie && setCookie.includes('session_id')) {
      const match = setCookie.match(/session_id=([^;]+)/);
      return match?.[1] ?? '';
    }
    return '';
  }

  /**
   * Normalizes an unknown error into a string or OdooError.
   * @param error The caught error value.
   * @returns A string representation of the error.
   */
  private _formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return String(error);
  }
}

export default Odoo;
