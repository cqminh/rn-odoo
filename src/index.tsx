/**
 * Minimal type declarations for fetch-related globals. React Native and DOM
 * environments provide these at runtime, but we declare local types to keep
 * TypeScript happy when DOM lib is not included in tsconfig.json.
 */
declare const fetch: (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string> | Headers;
    body?: string;
    signal?: AbortSignal;
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

interface Headers {
  forEach(callback: (value: string, key: string) => void): void;
  get(name: string): string | null;
}

declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(handle: unknown): void;

type FetchInit = {
  method?: string;
  headers?: Record<string, string> | Headers;
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
 * Configuration for the Odoo JSON-2 API client.
 */
export interface OdooConfig {
  /** Base URL of the Odoo instance, e.g. https://mycompany.example.com */
  host: string;
  /** API key used for Bearer authentication. */
  apiKey: string;
  /** Optional database name, sent as X-Odoo-Database header. */
  database?: string;
  /** Optional user-agent string identifying your software. */
  userAgent?: string;
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
  message?: string;
}

/**
 * Error shape returned by the Odoo JSON-2 API.
 */
export interface OdooError {
  name: string;
  message: string;
  arguments?: unknown[];
  context?: Record<string, unknown>;
  debug?: string;
}

/**
 * Version information returned by /web/version.
 */
export interface OdooVersionInfo {
  version: string;
  version_info: number[];
}

/**
 * Response shape returned by /web/database/list.
 */
export interface OdooDatabaseListResponse {
  result: string[];
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
 * Parameters for web_search_read operation (returns records + total count).
 */
export interface WebSearchReadParams {
  domain?: unknown[];
  /** Field names to fetch (use for simple lists). */
  fields?: string[];
  /**
   * Field specification map for relational fields (Odoo 17+ format).
   * Example: { name: {}, partner_id: { fields: { name: {} } } }
   */
  specification?: Record<string, unknown>;
  offset?: number;
  limit?: number;
  order?: string;
  /** Cap on the returned `length` value for performance. */
  count_limit?: number;
}

/**
 * Result shape returned by web_search_read.
 */
export interface WebSearchReadResult<T = Record<string, unknown>> {
  records: T[];
  length: number;
}

/**
 * Parameters for custom method calls.
 */
export interface CallMethodParams {
  /** Record IDs for non-@api.model methods. */
  ids?: number[];
  /** Named method parameters. */
  kwargs?: Record<string, unknown>;
}

/**
 * The Odoo class provides methods to interact with the Odoo JSON-2 API.
 * It allows you to perform CRUD operations, search for records, and manage API keys.
 */
class Odoo {
  host: string;
  apiKey: string;
  database?: string;
  userAgent?: string;
  private context: Record<string, unknown> = {};
  private timeout: number;
  private retry: { count: number; delay: number };
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private eventListeners: Map<OdooEvent, Set<OdooEventCallback>> = new Map();

  constructor(config: OdooConfig) {
    this.host = config.host.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.database = config.database;
    this.userAgent = config.userAgent;
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
   * Returns the current user context merged with the default context.
   * @returns The current context object.
   */
  getContext(): Record<string, unknown> {
    return { ...this.context };
  }

  /**
   * Sets the default context used for subsequent API calls.
   * @param context The context object to merge into the current context.
   */
  setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Retrieves the current user information and context.
   * This replaces the legacy connect() flow because JSON-2 API uses API keys.
   * @returns A promise that resolves to the current user context.
   */
  async connect(): Promise<OdooResult<Record<string, unknown>>> {
    const result = await this._json2Request<Record<string, unknown>>(
      'res.users',
      'context_get',
      {}
    );

    if (result.success && result.data) {
      if (typeof result.data !== 'object' || Array.isArray(result.data)) {
        const error = 'Invalid context response from Odoo';
        this._emit('error', error);
        return { success: false, error };
      }

      this.context = result.data;
      this._emit('connect', result.data);
    }

    return result;
  }

  /**
   * Alias for disconnecting / invalidating the current API key session.
   * Note: JSON-2 API keys are stateless, so this is a no-op by default.
   * It emits the disconnect event and clears the local context.
   * @returns A promise that resolves to a success result.
   */
  async disconnect(): Promise<OdooResult<null>> {
    this.context = {};
    this._emit('disconnect');
    return { success: true, data: null, message: 'Disconnected successfully' };
  }

  /**
   * Retrieves the Odoo server version information.
   * Corresponds to the legacy common service version() call.
   * @returns A promise that resolves to version info.
   */
  async getVersion(): Promise<OdooResult<OdooVersionInfo>> {
    return this._fetch<OdooVersionInfo>('/web/version', undefined, 'GET');
  }

  /**
   * Retrieves the list of databases available on the server.
   * Corresponds to the legacy db service list() call.
   * @returns A promise that resolves to an array of database names.
   */
  async getDatabases(): Promise<OdooResult<string[]>> {
    const result = await this._fetch<OdooDatabaseListResponse>(
      '/web/database/list',
      {},
      'POST'
    );

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.result,
      };
    }

    return {
      success: false,
      error: result.error ?? 'Failed to retrieve database list',
    };
  }

  /**
   * Searches for records in the specified model based on the provided parameters.
   * @param model The name of the model to search in.
   * @param params The search parameters, including the domain.
   * @param context Optional context to be used in the search.
   * @returns A promise that resolves to an array of record IDs.
   */
  async search(
    model: string,
    params: SearchParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<number[]>> {
    return this._json2Request<number[]>(model, 'search', {
      context: { ...this.context, ...context },
      domain: params.domain,
      offset: params.offset,
      limit: params.limit,
      order: params.order,
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
    return this._json2Request<T[]>(model, 'read', {
      ids,
      context: { ...this.context, ...context },
      fields,
    });
  }

  /**
   * Searches for records in the specified model and reads their data.
   * @param model The name of the model to search in.
   * @param params The search parameters, including the domain, offset, limit, order, and fields.
   * @param context Optional context to be used in the search.
   * @returns A promise that resolves to an array of records.
   */
  async search_read<T = Record<string, unknown>>(
    model: string,
    params: SearchParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T[]>> {
    return this._json2Request<T[]>(model, 'search_read', {
      context: { ...this.context, ...context },
      domain: params.domain,
      offset: params.offset,
      limit: params.limit,
      order: params.order,
      fields: params.fields,
    });
  }

  /**
   * Paginated search_read helper. Fetches records page by page until all
   * matching records are retrieved or the optional maxRecords limit is reached.
   * @param model The name of the model to search in.
   * @param params The search parameters. `offset` and `limit` are used as page size.
   * @param context Optional context.
   * @returns A promise that resolves to all matching records.
   */
  async search_read_paginated<T = Record<string, unknown>>(
    model: string,
    params: SearchParams & { maxRecords?: number },
    context?: Record<string, unknown>
  ): Promise<OdooResult<T[]>> {
    const pageSize = params.limit ?? 80;
    const maxRecords = params.maxRecords;
    const allRecords: T[] = [];
    let offset = params.offset ?? 0;

    while (true) {
      const fetchLimit =
        maxRecords !== undefined
          ? Math.min(pageSize, maxRecords - allRecords.length)
          : pageSize;

      const result = await this.search_read<T>(
        model,
        { ...params, limit: fetchLimit, offset },
        context
      );

      if (!result.success) {
        return result;
      }

      const records = result.data ?? [];
      if (records.length === 0) {
        break;
      }

      allRecords.push(...records);
      if (maxRecords !== undefined && allRecords.length > maxRecords) {
        allRecords.splice(maxRecords);
      }

      if (records.length < fetchLimit) {
        break;
      }

      if (maxRecords !== undefined && allRecords.length >= maxRecords) {
        break;
      }

      offset += fetchLimit;
    }

    return { success: true, data: allRecords };
  }

  /**
   * Searches and reads records, also returning the total count of matching records.
   * Useful for paginated UIs that need both the page data and the total row count
   * without issuing a separate search_count call.
   * @param model The name of the model to search in.
   * @param params Search parameters. Use `fields` for simple lists or `specification`
   *   for relational field nesting (Odoo 17+ format).
   * @param context Optional context.
   * @returns A promise that resolves to `{ records, length }`.
   */
  async web_search_read<T = Record<string, unknown>>(
    model: string,
    params: WebSearchReadParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<WebSearchReadResult<T>>> {
    // Odoo's web_search_read always requires `specification`; derive one from
    // `fields` when the caller only passed a flat field list.
    const specification =
      params.specification ??
      Object.fromEntries((params.fields ?? []).map((field) => [field, {}]));

    return this._json2Request<WebSearchReadResult<T>>(
      model,
      'web_search_read',
      {
        context: { ...this.context, ...context },
        domain: params.domain,
        specification,
        offset: params.offset,
        limit: params.limit,
        order: params.order,
        count_limit: params.count_limit,
      }
    );
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
    limit?: number,
    context?: Record<string, unknown>
  ): Promise<OdooResult<number>> {
    return this._json2Request<number>(model, 'search_count', {
      context: { ...this.context, ...context },
      domain,
      limit,
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
    return this._json2Request<T>(model, 'fields_get', {
      context: { ...this.context, ...context },
      // Odoo's fields_get ORM method takes `allfields`, not `fields`.
      allfields: params?.fields,
      attributes: params?.attributes,
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
    return this._json2Request<T[]>(model, 'read_group', {
      context: { ...this.context, ...context },
      domain: params.domain,
      fields: params.fields,
      groupby: params.groupby,
      offset: params.offset,
      limit: params.limit,
      orderby: params.orderby,
      lazy: params.lazy,
    });
  }

  /**
   * Creates a new record in the specified model with the provided parameters.
   * @param model The name of the model to create a record in.
   * @param params The parameters for the new record.
   * @param context Optional context to be used in the creation.
   * @returns A promise that resolves to the created record's ID or an error.
   */
  async create<T = number>(
    model: string,
    params: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T>> {
    return this._json2Request<T>(model, 'create', {
      ...params,
      context: { ...this.context, ...context },
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
    return this._json2Request<boolean>(model, 'write', {
      ...params,
      ids,
      context: { ...this.context, ...context },
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
    return this._json2Request<boolean>(model, 'unlink', {
      ids,
      context: { ...this.context, ...context },
    });
  }

  /**
   * Calls a method on the specified model with the provided parameters.
   * @param model The name of the model to call the method on.
   * @param method The name of the method to call.
   * @param params The parameters for the method call, including ids and kwargs.
   * @param context Optional context to be used in the method call.
   * @returns A promise that resolves to the result of the method call or an error.
   */
  async call_method<T = unknown>(
    model: string,
    method: string,
    params: CallMethodParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T>> {
    const kwargs = params.kwargs ?? {};
    const kwargsContext =
      typeof kwargs.context === 'object'
        ? (kwargs.context as Record<string, unknown>)
        : {};
    const remainingKwargs: Record<string, unknown> = {};
    for (const key of Object.keys(kwargs)) {
      if (key !== 'context') {
        remainingKwargs[key] = kwargs[key];
      }
    }

    return this._json2Request<T>(model, method, {
      ids: params.ids,
      context: { ...this.context, ...kwargsContext, ...context },
      ...remainingKwargs,
    });
  }

  /**
   * Sends multiple JSON-2 calls concurrently and collects their results in
   * order. Odoo's JSON-2 API has no server-side batch endpoint, so this
   * issues one HTTP request per call (via `Promise.all`) rather than a
   * single round trip.
   * @param calls An array of batch call descriptors.
   * @returns A promise that resolves to an array of each call's raw result.
   *   Fails with the first encountered error if any call fails.
   */
  async batch<T extends unknown[] = unknown[]>(
    calls: { model: string; method: string; params?: Record<string, unknown> }[]
  ): Promise<OdooResult<T>> {
    const results = await Promise.all(
      calls.map((call) =>
        this._json2Request(call.model, call.method, {
          context: this.context,
          ...(call.params ?? {}),
        })
      )
    );

    const failed = results.find((result) => !result.success);
    if (failed) {
      return { success: false, error: failed.error };
    }

    return { success: true, data: results.map((result) => result.data) as T };
  }

  /**
   * Generates a new API key programmatically.
   * Requires the calling key to have permission to generate API keys.
   * Odoo requires the current key to be re-submitted as an identity check
   * before minting a new one.
   * @param params Parameters for key generation.
   * @returns A promise that resolves to the new API key string.
   */
  async generateApiKey(params: {
    scope?: string | null;
    name: string;
    expiration_date?: string;
  }): Promise<OdooResult<string>> {
    return this._json2Request<string>('res.users.apikeys', 'generate', {
      key: this.apiKey,
      scope: params.scope ?? null,
      name: params.name,
      expiration_date: params.expiration_date,
    });
  }

  /**
   * Revokes an API key programmatically.
   * @param key The API key to revoke. Defaults to the current key.
   * @returns A promise that resolves to a success result.
   */
  async revokeApiKey(key?: string): Promise<OdooResult<null>> {
    return this._json2Request<null>('res.users.apikeys', 'revoke', {
      key: key ?? this.apiKey,
    });
  }

  /**
   * Makes a request to the Odoo JSON-2 API endpoint.
   * @param model The model name.
   * @param method The method name.
   * @param body The request body.
   * @returns A promise that resolves to the response data or an error.
   */
  protected async _json2Request<T = unknown>(
    model: string,
    method: string,
    body: Record<string, unknown>
  ): Promise<OdooResult<T>> {
    const path = `/json/2/${model}/${method}`;
    const cleanedBody = this._cleanBody(body);
    return this._fetch<T>(path, cleanedBody);
  }

  /**
   * Removes undefined values from the request body.
   */
  private _cleanBody(body: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (body[key] !== undefined) {
        cleaned[key] = body[key];
      }
    }
    return cleaned;
  }

  /**
   * Core fetch wrapper used by all outgoing requests.
   * Applies interceptors, timeout, retry logic, and unified error handling.
   */
  private async _fetch<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<OdooResult<T>> {
    let result: OdooResult<T> = { success: false };

    for (let attempt = 0; attempt <= this.retry.count; attempt++) {
      result = await this._fetchOnce<T>(path, body, method);

      if (result.success) {
        return result;
      }

      if (!this._shouldRetry(result.error) || attempt === this.retry.count) {
        this._emit('error', result.error);
        return result;
      }

      if (this.retry.delay > 0) {
        await this._sleep(this.retry.delay);
      }
    }

    return result;
  }

  /**
   * Determines whether a failed request should be retried.
   * Aborted requests and client errors (4xx) are not retried.
   * Only network errors and server errors (5xx) are retried.
   */
  private _shouldRetry(error: OdooError | string | undefined): boolean {
    if (typeof error === 'string') {
      // HTTP 4xx errors and abort/timeout should not be retried.
      if (/aborted|timeout/i.test(error)) {
        return false;
      }
      if (/^HTTP\s+4\d{2}/i.test(error)) {
        return false;
      }
      return true;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      typeof error.name === 'string'
    ) {
      return !/Unauthorized|Forbidden|BadRequest|NotFound|Unprocessable/i.test(
        error.name
      );
    }

    return true;
  }

  /**
   * Performs a single fetch attempt.
   */
  private async _fetchOnce<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<OdooResult<T>> {
    let url = `${this.host}${path}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `bearer ${this.apiKey}`,
    };

    if (method === 'POST') {
      headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    if (this.database) {
      headers['X-Odoo-Database'] = this.database;
    }

    if (this.userAgent) {
      headers['User-Agent'] = this.userAgent;
    }

    let init: FetchInit = {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

      if (!response.ok) {
        const errorJson = await this._safeParseJson(response);
        const error: OdooError | string =
          errorJson && this._isOdooError(errorJson)
            ? (errorJson as OdooError)
            : `HTTP ${response.status}: ${response.statusText}`;
        return { success: false, error };
      }

      const responseJson = (await response.json()) as T;

      if (this._isOdooError(responseJson)) {
        return { success: false, error: responseJson as OdooError };
      }

      let result: OdooResult<T> = {
        success: true,
        data: responseJson,
      };

      for (const interceptor of this.responseInterceptors) {
        const modified = await interceptor(result);
        if (modified) {
          result = modified as OdooResult<T>;
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: this._formatError(error),
      };
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Safely parses a JSON response, returning null on failure.
   */
  private async _safeParseJson(response: {
    json: () => Promise<unknown>;
  }): Promise<unknown | null> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Checks whether a parsed JSON object matches the Odoo JSON-2 error shape.
   */
  private _isOdooError(value: unknown): value is OdooError {
    return (
      typeof value === 'object' &&
      value !== null &&
      'name' in value &&
      typeof (value as Record<string, unknown>).name === 'string' &&
      'message' in value &&
      typeof (value as Record<string, unknown>).message === 'string'
    );
  }

  /**
   * Waits for the specified number of milliseconds.
   */
  private async _sleep(ms: number): Promise<void> {
    let id: unknown;
    try {
      await new Promise<void>((resolve) => {
        id = setTimeout(resolve, ms);
      });
    } finally {
      clearTimeout(id);
    }
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

export { Odoo };
export default Odoo;
